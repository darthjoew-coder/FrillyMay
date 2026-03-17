import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'
import mongoose from 'mongoose'
import { createExpenseFromReceipt } from '../route'

export async function POST() {
  try {
    await connectDB()

    const unlinked = await Receipt.find({
      source: 'mobile',
      expenseId: { $exists: false },
    })
      .select('_id merchantName receiptDate totalAmount paymentMethod')
      .lean()

    let created = 0
    for (const r of unlinked) {
      const raw = r as unknown as Record<string, unknown>
      const extractedData: Record<string, unknown> = {
        merchantName: raw.merchantName,
        receiptDate: raw.receiptDate,
        totalAmount: raw.totalAmount,
        paymentMethod: raw.paymentMethod,
      }
      await createExpenseFromReceipt(extractedData, raw._id as mongoose.Types.ObjectId)
      created++
    }

    return NextResponse.json({ created, total: unlinked.length })
  } catch (err) {
    console.error('[backfill-expenses]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
