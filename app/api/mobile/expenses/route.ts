import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Receipt } from '@/models/Receipt'
import { verifyMobileAuth, corsHeaders, corsOptionsResponse } from '@/lib/mobileAuth'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders()
  const user = await verifyMobileAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  try {
    await connectDB()
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

    const filter: Record<string, unknown> = {}
    const year = searchParams.get('year')
    if (year) filter.taxYear = Number(year)
    const search = searchParams.get('search')
    if (search) filter.vendor = { $regex: search, $options: 'i' }

    const [rawExpenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('categoryId', 'name')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = rawExpenses as any[]
    const expenseIds = rows.map(e => e._id)
    const receiptCounts = await Receipt.aggregate([
      { $match: { expenseId: { $in: expenseIds } } },
      { $group: { _id: '$expenseId', count: { $sum: 1 } } },
    ])
    const countMap: Record<string, number> = {}
    receiptCounts.forEach((r: { _id: unknown; count: number }) => {
      countMap[String(r._id)] = r.count
    })

    const expenses = rows.map(e => ({
      _id: String(e._id),
      source: 'expense' as const,
      vendor: e.vendor,
      amount: e.amount,
      date: e.date,
      categoryName: e.categoryId?.name ?? null,
      paymentMethod: e.paymentMethod,
      status: e.status,
      productLine: e.productLine,
      taxYear: e.taxYear,
      description: e.description ?? null,
      receiptCount: countMap[String(e._id)] || 0,
      createdAt: e.createdAt,
    }))

    return NextResponse.json({ data: expenses, total, page }, { headers })
  } catch (err) {
    console.error('[mobile/expenses GET]', err)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500, headers })
  }
}
