import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { HealthRecord } from '@/models/HealthRecord'
import { Animal } from '@/models/Animal'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const animalId = searchParams.get('animalId')
    const type = searchParams.get('type')
    const upcoming = searchParams.get('upcoming')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {}
    if (animalId) query.animalId = animalId
    if (type) query.type = type
    if (upcoming === 'true') {
      const now = new Date()
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      query.nextDueDate = { $gte: now, $lte: future }
    }

    const total = await HealthRecord.countDocuments(query)
    const records = await HealthRecord.find(query)
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
    const record = await HealthRecord.create(body)

    // Update animal weight if provided
    if (body.weight && body.animalId) {
      await Animal.findByIdAndUpdate(body.animalId, { currentWeight: body.weight })
    }

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
