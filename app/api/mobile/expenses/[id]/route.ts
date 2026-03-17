import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Receipt } from '@/models/Receipt'
import { verifyMobileAuth, corsHeaders, corsOptionsResponse } from '@/lib/mobileAuth'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const headers = corsHeaders()
  const user = await verifyMobileAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  try {
    await connectDB()
    const { id } = await params

    const raw = await Expense.findById(id).populate('categoryId', 'name').lean()
    if (!raw) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = raw as any

    // Fetch linked receipts (thumbnails only)
    const receiptDocs = await Receipt.find({ expenseId: id })
      .select('_id source fileName merchantName thumbnailData imageMimeType imageSize')
      .lean()

    const receipts = receiptDocs.map(r => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = r as any
      return {
        _id: String(rec._id),
        source: rec.source,
        fileName: rec.fileName ?? null,
        merchantName: rec.merchantName ?? null,
        imageSize: rec.imageSize ?? 0,
        imageMimeType: rec.imageMimeType ?? '',
        thumbnailBase64: rec.thumbnailData
          ? `data:image/jpeg;base64,${(rec.thumbnailData as Buffer).toString('base64')}`
          : null,
      }
    })

    const expense = {
      _id: String(e._id),
      vendor: e.vendor,
      amount: e.amount,
      date: e.date,
      taxYear: e.taxYear,
      categoryId: e.categoryId?._id ? String(e.categoryId._id) : null,
      categoryName: e.categoryId?.name ?? null,
      subcategory: e.subcategory ?? null,
      paymentMethod: e.paymentMethod,
      description: e.description ?? null,
      notes: e.notes ?? null,
      productLine: e.productLine,
      status: e.status,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      receipts,
    }

    return NextResponse.json({ data: expense }, { headers })
  } catch (err) {
    console.error('[mobile/expenses/:id GET]', err)
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500, headers })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const headers = corsHeaders()
  const user = await verifyMobileAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    const allowed = ['vendor', 'amount', 'date', 'paymentMethod', 'description', 'notes', 'status', 'productLine']
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) update[key] = body[key]
    }
    if (update.date) {
      update.taxYear = new Date(update.date as string).getFullYear()
    }

    const updated = await Expense.findByIdAndUpdate(id, update, { new: true })
      .populate('categoryId', 'name')
      .lean()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404, headers })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = updated as any
    return NextResponse.json({
      data: {
        _id: String(e._id),
        vendor: e.vendor,
        amount: e.amount,
        date: e.date,
        taxYear: e.taxYear,
        categoryName: e.categoryId?.name ?? null,
        paymentMethod: e.paymentMethod,
        description: e.description ?? null,
        notes: e.notes ?? null,
        productLine: e.productLine,
        status: e.status,
      },
    }, { headers })
  } catch (err) {
    console.error('[mobile/expenses/:id PUT]', err)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500, headers })
  }
}
