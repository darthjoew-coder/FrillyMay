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

    const rawReceipts = await Receipt.find({ expenseId: id })
      .select('fileName imageMimeType imageSize source merchantName receiptDate totalAmount status uploadedAt createdAt')
      .lean()

    // Normalize receipt shape for the web UI (handle old docs with mimeType/fileSize)
    const receipts = rawReceipts.map(r => {
      const doc = r as unknown as Record<string, unknown>
      return {
        _id: r._id,
        expenseId: id,
        source: r.source || 'web',
        fileName: r.fileName || (r.merchantName ? `Receipt ${r.merchantName}` : 'receipt'),
        imageMimeType: r.imageMimeType || (doc.mimeType as string | undefined) || '',
        imageSize: r.imageSize || (doc.fileSize as number | undefined) || 0,
        // mobile-specific
        merchantName: r.merchantName,
        receiptDate: r.receiptDate,
        totalAmount: r.totalAmount,
        status: r.status,
        uploadedAt: r.uploadedAt || r.createdAt,
      }
    })

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

    // Cascade delete all receipts linked to this expense
    await Receipt.deleteMany({ expenseId: id })
    await Expense.findByIdAndDelete(id)

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
