import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'
import mongoose from 'mongoose'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = req.nextUrl
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'))
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {
      customerId: new mongoose.Types.ObjectId(id),
    }
    if (year) filter.taxYear = year

    const [data, total] = await Promise.all([
      Sale.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Sale.countDocuments(filter),
    ])

    return NextResponse.json({ data, total, page })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch customer sales' }, { status: 500 })
  }
}
