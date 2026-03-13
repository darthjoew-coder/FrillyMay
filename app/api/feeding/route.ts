import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { FeedingRecord } from '@/models/FeedingRecord'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const animalId = searchParams.get('animalId')
    const isTemplate = searchParams.get('isScheduleTemplate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {}
    if (animalId) query.animalId = animalId
    if (isTemplate !== null) query.isScheduleTemplate = isTemplate === 'true'

    const total = await FeedingRecord.countDocuments(query)
    const records = await FeedingRecord.find(query)
      .populate('animalId', 'tagId name species')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const formatted = records.map(r => ({ ...r, animal: r.animalId }))
    return NextResponse.json({ data: formatted, total, page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const record = await FeedingRecord.create(body)
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
