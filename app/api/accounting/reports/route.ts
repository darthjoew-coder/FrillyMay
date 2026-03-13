import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Sale } from '@/models/Sale'
import { Receipt } from '@/models/Receipt'

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
    ] = await Promise.all([
      // Total income
      Sale.aggregate([
        { $match: { taxYear: year } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Income by product type
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
    ])

    const totalIncome = incomeAgg[0]?.total || 0
    const totalExpenses = expenseAgg[0]?.total || 0

    // Group expenses by Schedule F bucket
    const byScheduleF: Record<string, number> = {}
    byCategory.forEach((c: any) => {
      const bucket = c._id.scheduleFBucket || 'Uncategorized'
      byScheduleF[bucket] = (byScheduleF[bucket] || 0) + c.total
    })

    const report = {
      year,
      income: {
        totalAmount: totalIncome,
        byProductType: byProductType.map((p: any) => ({
          productType: p._id,
          total: p.total,
          count: p.count,
        })),
      },
      expenses: {
        totalAmount: totalExpenses,
        byCategory: byCategory.map((c: any) => ({
          categoryId: String(c._id.categoryId),
          name: c._id.name || 'Uncategorized',
          scheduleFBucket: c._id.scheduleFBucket || '',
          total: c.total,
          count: c.count,
        })),
        byScheduleF: Object.entries(byScheduleF)
          .map(([bucket, total]) => ({ bucket, total }))
          .sort((a, b) => b.total - a.total),
      },
      netIncome: totalIncome - totalExpenses,
      missingReceipts: expensesWithoutReceipts,
    }

    return NextResponse.json({ data: report })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
