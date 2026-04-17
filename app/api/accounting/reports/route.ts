import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Sale } from '@/models/Sale'
import { Receipt } from '@/models/Receipt'
import { AnimalSale } from '@/models/AnimalSale'
import { AssetDepreciation } from '@/models/AssetDepreciation'
import { OwnerEquity } from '@/models/OwnerEquity'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const year = Number(searchParams.get('year') || new Date().getFullYear())

    const [
      incomeAgg,
      byProductType,
      expenseAgg,
      byCategory,
      expensesWithoutReceipts,
      // Livestock Schedule F: Line 1 (purchased for resale)
      line1Agg,
      // Livestock Schedule F: Line 2 (raised for sale)
      line2Agg,
      // Breeding/dairy/draft animals sold – excluded from Schedule F, flag for Form 4797
      form4797Agg,
      // Animals sold but not yet classified – excluded from all lines
      reviewNeededAgg,
      // Schedule F Line 14d / Form 4562 – depreciation
      depreciationAgg,
      // Owner equity this year
      equityThisYearAgg,
      // Cumulative equity through prior year
      equityPriorAgg,
    ] = await Promise.all([
      // Total non-livestock income (product sales: beef, eggs, other)
      Sale.aggregate([
        { $match: { taxYear: year } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Non-livestock income by product type
      Sale.aggregate([
        { $match: { taxYear: year } },
        {
          $group: {
            _id: '$productType',
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Total expenses
      Expense.aggregate([
        { $match: { taxYear: year } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Expenses by category with Schedule F bucket
      Expense.aggregate([
        { $match: { taxYear: year } },
        {
          $lookup: {
            from: 'expensecategories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              categoryId: '$categoryId',
              name: '$cat.name',
              scheduleFBucket: '$cat.scheduleFBucket',
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.name': 1 } },
      ]),

      // Count expenses missing receipts
      (async () => {
        const allExpenseIds = await Expense.distinct('_id', { taxYear: year })
        const expensesWithReceipts = await Receipt.distinct('expenseId', {
          expenseId: { $in: allExpenseIds },
        })
        return allExpenseIds.length - expensesWithReceipts.length
      })(),

      /**
       * Schedule F Line 1 – Purchased livestock sold for resale.
       * Line 1a = gross sale amount.
       * Line 1b = cost basis (deferred from year of purchase, recognised now).
       */
      AnimalSale.aggregate([
        { $match: { taxYear: year, classificationAtSale: 'resale_inventory' } },
        {
          $group: {
            _id: null,
            line1a: { $sum: '$saleAmount' },
            line1b: { $sum: '$costBasis' },
            count: { $sum: 1 },
          },
        },
      ]),

      /**
       * Schedule F Line 2 – Raised livestock sold.
       * Full sale price reported; no cost basis because raising expenses
       * (feed, vet, etc.) were already deducted in the year paid.
       */
      AnimalSale.aggregate([
        { $match: { taxYear: year, classificationAtSale: 'raised_for_sale' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$saleAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      /**
       * Breeding / dairy / draft animals – EXCLUDED from Schedule F livestock lines.
       * These are capital assets; their sale is reported on IRS Form 4797.
       */
      AnimalSale.aggregate([
        { $match: { taxYear: year, classificationAtSale: { $in: ['breeding_dairy', 'draft_work'] } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$saleAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Animals with no classification assigned – not reported anywhere
      AnimalSale.aggregate([
        { $match: { taxYear: year, classificationAtSale: { $in: ['review_needed', 'other'] } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),

      /**
       * Schedule F Line 14d / Form 4562 – Depreciation and Section 179 expense.
       * Sum of all AssetDepreciation records for this tax year.
       */
      AssetDepreciation.aggregate([
        { $match: { taxYear: year } },
        {
          $group: {
            _id: null,
            total: { $sum: '$depreciationAmount' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Owner equity this year (contributions and draws)
      OwnerEquity.aggregate([
        { $match: { taxYear: year } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } },
      ]),

      // Cumulative owner equity through end of prior year
      OwnerEquity.aggregate([
        { $match: { taxYear: { $lt: year } } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ])

    const totalProductIncome = incomeAgg[0]?.total || 0
    const totalExpenses = expenseAgg[0]?.total || 0
    const depreciationTotal: number = depreciationAgg[0]?.total || 0
    const depreciationCount: number = depreciationAgg[0]?.count || 0

    // Owner equity calculations
    const equityMap = (agg: any[]) => {
      const m: Record<string, number> = {}
      agg.forEach((r: any) => { m[r._id] = r.total })
      return m
    }
    const thisYearEquity = equityMap(equityThisYearAgg)
    const priorEquity = equityMap(equityPriorAgg)
    const contributions: number = thisYearEquity['contribution'] || 0
    const draws: number = thisYearEquity['draw'] || 0
    const priorContributions: number = priorEquity['contribution'] || 0
    const priorDraws: number = priorEquity['draw'] || 0
    const priorYearBalance = priorContributions - priorDraws
    const cumulativeBalance = priorYearBalance + contributions - draws

    // Livestock Schedule F totals
    const line1a: number = line1Agg[0]?.line1a || 0
    const line1b: number = line1Agg[0]?.line1b || 0
    const line2: number = line2Agg[0]?.total || 0
    const form4797Total: number = form4797Agg[0]?.total || 0
    const form4797Count: number = form4797Agg[0]?.count || 0
    const reviewNeededCount: number = reviewNeededAgg[0]?.count || 0

    // Total income = product sales + raised livestock (Line 2) + purchased livestock net (Line 1 net)
    // NOTE: Line 1b (cost basis) is NOT an expense here – it reduces gross livestock income on the form.
    const livestockIncome = line1a + line2
    const totalIncome = totalProductIncome + livestockIncome

    // Group expenses by Schedule F bucket
    const byScheduleF: Record<string, number> = {}
    byCategory.forEach((c: Record<string, unknown>) => {
      const id = c._id as Record<string, unknown>
      const bucket = (id.scheduleFBucket as string) || 'Uncategorized'
      byScheduleF[bucket] = (byScheduleF[bucket] || 0) + (c.total as number)
    })

    const report = {
      year,
      income: {
        totalAmount: totalIncome,
        byProductType: byProductType.map((p: Record<string, unknown>) => ({
          productType: p._id,
          total: p.total,
          count: p.count,
        })),
      },
      livestock: {
        line1a,
        line1b,
        line1Net: line1a - line1b,
        line2,
        form4797Total,
        form4797Count,
        reviewNeededCount,
      },
      expenses: {
        totalAmount: totalExpenses,
        byCategory: byCategory.map((c: Record<string, unknown>) => {
          const id = c._id as Record<string, unknown>
          return {
            categoryId: String(id.categoryId),
            name: (id.name as string) || 'Uncategorized',
            scheduleFBucket: (id.scheduleFBucket as string) || '',
            total: c.total as number,
            count: c.count as number,
          }
        }),
        byScheduleF: Object.entries(byScheduleF)
          .map(([bucket, total]) => ({ bucket, total }))
          .sort((a, b) => b.total - a.total),
      },
      depreciation: {
        /** Schedule F Line 14d – total depreciation deductions this year */
        totalAmount: depreciationTotal,
        assetCount: depreciationCount,
      },
      netIncome: totalIncome - totalExpenses,
      missingReceipts: expensesWithoutReceipts,
      equity: {
        contributions,
        draws,
        netThisYear: contributions - draws,
        cumulativeBalance,
        priorYearBalance,
      },
    }

    return NextResponse.json({ data: report })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
