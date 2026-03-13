import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Animal } from '@/models/Animal'
import { HealthRecord } from '@/models/HealthRecord'
import { FeedingRecord } from '@/models/FeedingRecord'
import { BreedingEvent } from '@/models/BreedingEvent'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const animal = await Animal.findById(id).lean()
    if (!animal) return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    return NextResponse.json({ data: animal })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const animal = await Animal.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!animal) return NextResponse.json({ error: 'Animal not found' }, { status: 404 })
    return NextResponse.json({ data: animal })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const cascade = searchParams.get('cascade') === 'true'

    const animal = await Animal.findById(id)
    if (!animal) return NextResponse.json({ error: 'Animal not found' }, { status: 404 })

    if (cascade) {
      await Promise.all([
        HealthRecord.deleteMany({ animalId: id }),
        FeedingRecord.deleteMany({ animalId: id }),
        BreedingEvent.deleteMany({ $or: [{ damId: id }, { sireId: id }] }),
      ])
      await Animal.findByIdAndDelete(id)
    } else {
      await Animal.findByIdAndDelete(id)
    }

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
