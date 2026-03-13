import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Receipt } from '@/models/Receipt'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const raw = await Expense.findById(id).populate('categoryId', 'name scheduleFBucket').lean() as any
    if (!raw) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    const receipts = await Receipt.find({ expenseId: id })
      .select('fileName mimeType fileSize uploadedAt')
      .lean()

    return NextResponse.json({ data: { ...raw, category: raw.categoryId, receipts } })
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

    const raw = await Expense.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('categoryId', 'name scheduleFBucket')
      .lean() as any
    if (!raw) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    return NextResponse.json({ data: { ...raw, category: raw.categoryId } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const expense = await Expense.findById(id)
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    // Cascade delete receipts
    await Receipt.deleteMany({ expenseId: id })
    await Expense.findByIdAndDelete(id)

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
