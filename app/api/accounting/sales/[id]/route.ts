import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const sale = await Sale.findById(id).lean()
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    return NextResponse.json({ data: sale })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    if (body.date) {
      body.taxYear = new Date(body.date).getFullYear()
    }

    const sale = await Sale.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    return NextResponse.json({ data: sale })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const sale = await Sale.findById(id)
    if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    await Sale.findByIdAndDelete(id)
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
