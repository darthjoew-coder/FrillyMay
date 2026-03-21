import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const receipt = await Receipt.findById(id)
      .select('status source merchantName fileName receiptDate totalAmount expenseId')
      .lean()
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    return NextResponse.json({ data: receipt })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
