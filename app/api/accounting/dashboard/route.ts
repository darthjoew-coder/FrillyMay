import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'
import { Customer } from '@/models/Customer'
import { FISCAL_YEAR_START_MONTH } from '@/lib/constants'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = req.nextUrl
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

    // Build fiscal year date range
    // If fiscal year starts Jan, FY 2025 = Jan 1 2025 – Dec 31 2025
    // If fiscal year starts e.g. Oct, FY 2025 = Oct 1 2024 – Sep 30 2025
    const fyStart = new Date(
      FISCAL_YEAR_START_MONTH === 1 ? year : year - 1,
      FISCAL_YEAR_START_MONTH - 1,
      1
    )
    const fyEnd = new Date(
      FISCAL_YEAR_START_MONTH === 1 ? year + 1 : year,
      FISCAL_YEAR_START_MONTH - 1,
      1
    )

    // Parallel aggregations
    const [monthlyRaw, byProductRaw, topCustomersRaw] = await Promise.all([
      // Monthly totals
      Sale.aggregate([
        { $match: { date: { $gte: fyStart, $lt: fyEnd } } },
        {
          $group: {
            _id: { $month: '$date' },
            total: { $sum: '$totalAmount' },
          },
        },
      ]),

      // Sales by product type
      Sale.aggregate([
        { $match: { date: { $gte: fyStart, $lt: fyEnd } } },
        {
          $group: {
            _id: '$productType',
            total: { $sum: '$totalAmount' },
            quantity: { $sum: '$quantity' },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Top customers (only sales with a customerId)
      Sale.aggregate([
        {
          $match: {
            date: { $gte: fyStart, $lt: fyEnd },
            customerId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$customerId',
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerDoc',
          },
        },
        { $unwind: { path: '$customerDoc', preserveNullAndEmptyArrays: false } },
        {
          $project: {
            customerId: '$_id',
            displayName: '$customerDoc.displayName',
            total: 1,
            count: 1,
          },
        },
      ]),
    ])

    // Build full 12-month array with zeros for missing months
    const monthMap = new Map<number, number>(monthlyRaw.map(r => [r._id as number, r.total as number]))
    const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
      const calendarMonth = ((FISCAL_YEAR_START_MONTH - 1 + i) % 12) + 1
      return {
        month: calendarMonth,
        label: MONTH_LABELS[calendarMonth - 1],
        total: monthMap.get(calendarMonth) ?? 0,
      }
    })

    const salesByProduct = byProductRaw.map(r => ({
      productType: r._id as string,
      total: r.total as number,
      quantity: r.quantity as number | null,
    }))

    const topCustomers = topCustomersRaw.map(r => ({
      customerId: String(r.customerId),
      displayName: r.displayName as string,
      total: r.total as number,
      count: r.count as number,
    }))

    // Ensure Customer model is registered (needed for $lookup)
    void Customer

    return NextResponse.json({ data: { monthlyTotals, salesByProduct, topCustomers } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
