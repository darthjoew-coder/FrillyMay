import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Receipt } from '@/models/Receipt'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)

    const filter: Record<string, unknown> = {}

    const year = searchParams.get('year')
    if (year) filter.taxYear = Number(year)

    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.$gte = new Date(dateFrom)
      if (dateTo) dateFilter.$lte = new Date(dateTo + 'T23:59:59.999Z')
      filter.date = dateFilter
    }

    const categoryId = searchParams.get('categoryId')
    if (categoryId) filter.categoryId = categoryId

    const productLine = searchParams.get('productLine')
    if (productLine) filter.productLine = productLine

    const status = searchParams.get('status')
    if (status) filter.status = status

    const vendor = searchParams.get('vendor')
    if (vendor) filter.vendor = { $regex: vendor, $options: 'i' }

    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Number(searchParams.get('limit') || 50))

    const [rawExpenses, total] = await Promise.all([
      Expense.find(filter)
        .populate('categoryId', 'name scheduleFBucket')
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ])

    // Get receipt counts per expense
    const expenseIds = rawExpenses.map((e: any) => e._id)
    const receiptCounts = await Receipt.aggregate([
      { $match: { expenseId: { $in: expenseIds } } },
      { $group: { _id: '$expenseId', count: { $sum: 1 } } },
    ])
    const countMap: Record<string, number> = {}
    receiptCounts.forEach((r: any) => { countMap[String(r._id)] = r.count })

    const expenses = rawExpenses.map((e: any) => ({
      ...e,
      category: e.categoryId,
      receiptCount: countMap[String(e._id)] || 0,
    }))

    return NextResponse.json({ data: expenses, total, page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    // Derive taxYear from date server-side
    if (body.date) {
      body.taxYear = new Date(body.date).getFullYear()
    }

    const expense = await Expense.create(body)
    const populated = await Expense.findById(expense._id)
      .populate('categoryId', 'name scheduleFBucket')
      .lean() as any
    return NextResponse.json({ data: { ...populated, category: populated.categoryId } }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
