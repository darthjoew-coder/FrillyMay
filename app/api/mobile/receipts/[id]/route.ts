import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'
import { verifyMobileAuth, corsHeaders, corsOptionsResponse } from '@/lib/mobileAuth'
import mongoose from 'mongoose'

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
    const doc = await Receipt.findOne({
      _id: id,
      source: 'mobile',
      userId: new mongoose.Types.ObjectId(user.userId),
    })
      .select('-imageData -thumbnailData')
      .lean()

    if (!doc) return NextResponse.json({ error: 'Receipt not found' }, { status: 404, headers })

    return NextResponse.json({ data: doc }, { headers })
  } catch (err) {
    console.error('[mobile/receipts/[id] GET]', err)
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500, headers })
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

    // Only allow updating user-editable fields
    const allowed = [
      'merchantName', 'receiptDate', 'totalAmount', 'subtotalAmount',
      'taxAmount', 'category', 'notes', 'paymentMethod', 'lineItems', 'status',
    ]
    const update: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) {
        update[key] = body[key]
      }
    }

    if (body.receiptDate) update.receiptDate = new Date(body.receiptDate)

    const doc = await Receipt.findOneAndUpdate(
      { _id: id, source: 'mobile', userId: new mongoose.Types.ObjectId(user.userId) },
      update,
      { new: true, runValidators: true }
    )
      .select('-imageData -thumbnailData')
      .lean()

    if (!doc) return NextResponse.json({ error: 'Receipt not found' }, { status: 404, headers })

    return NextResponse.json({ data: doc }, { headers })
  } catch (err) {
    console.error('[mobile/receipts/[id] PUT]', err)
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 400, headers })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const headers = corsHeaders()
  const user = await verifyMobileAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  try {
    await connectDB()
    const { id } = await params
    const deleted = await Receipt.findOneAndDelete({
      _id: id,
      source: 'mobile',
      userId: new mongoose.Types.ObjectId(user.userId),
    })

    if (!deleted) return NextResponse.json({ error: 'Receipt not found' }, { status: 404, headers })

    return NextResponse.json({ data: { deleted: true } }, { headers })
  } catch (err) {
    console.error('[mobile/receipts/[id] DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500, headers })
  }
}
