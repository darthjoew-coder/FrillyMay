import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'

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

    const productType = searchParams.get('productType')
    if (productType) filter.productType = productType

    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Number(searchParams.get('limit') || 50))

    const [sales, total] = await Promise.all([
      Sale.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Sale.countDocuments(filter),
    ])

    return NextResponse.json({ data: sales, total, page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    if (body.date) {
      body.taxYear = new Date(body.date).getFullYear()
    }

    const sale = await Sale.create(body)
    return NextResponse.json({ data: sale }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
