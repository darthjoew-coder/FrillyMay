import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { BreedingEvent } from '@/models/BreedingEvent'
import { GESTATION_DAYS } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const damId = searchParams.get('damId')
    const status = searchParams.get('status')
    const species = searchParams.get('species')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {}
    if (damId) query.damId = damId
    if (status) query.status = status
    if (species) query.species = species

    const total = await BreedingEvent.countDocuments(query)
    const events = await BreedingEvent.find(query)
      .populate('damId', 'tagId name species')
      .populate('sireId', 'tagId name')
      .sort({ breedingDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const formatted = events.map(e => ({ ...e, dam: e.damId, sire: e.sireId }))
    return NextResponse.json({ data: formatted, total, page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    // Auto-calculate expected due date
    if (!body.expectedDueDate && body.breedingDate && body.species) {
      const gestDays = body.gestationDays || GESTATION_DAYS[body.species]
      if (gestDays) {
        const breedDate = new Date(body.breedingDate)
        body.expectedDueDate = new Date(breedDate.getTime() + gestDays * 24 * 60 * 60 * 1000)
        body.gestationDays = gestDays
      }
    }

    const event = await BreedingEvent.create(body)
    return NextResponse.json({ data: event }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
