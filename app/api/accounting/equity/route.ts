import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { OwnerEquity } from '@/models/OwnerEquity'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)

    const filter: Record<string, unknown> = {}
    const year = searchParams.get('year')
    if (year) filter.taxYear = Number(year)
    const type = searchParams.get('type')
    if (type) filter.type = type

    const records = await OwnerEquity.find(filter).sort({ date: -1 }).lean()
    return NextResponse.json({ data: records })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    if (body.date) body.taxYear = new Date(body.date).getFullYear()
    const record = await OwnerEquity.create(body)
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
