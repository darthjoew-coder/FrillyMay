import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { BreedingEvent } from '@/models/BreedingEvent'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const event = await BreedingEvent.findById(id)
      .populate('damId', 'tagId name species')
      .populate('sireId', 'tagId name')
      .lean()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    return NextResponse.json({ data: { ...event, dam: event.damId, sire: event.sireId } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const event = await BreedingEvent.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    return NextResponse.json({ data: event })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    await BreedingEvent.findByIdAndDelete(id)
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
