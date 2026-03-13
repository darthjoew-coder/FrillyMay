import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Animal } from '@/models/Animal'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const species = searchParams.get('species')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const query: Record<string, unknown> = {}
    if (species) query.species = species
    if (status) query.status = status
    if (search) query.$or = [
      { tagId: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ]

    const total = await Animal.countDocuments(query)
    const animals = await Animal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({ data: animals, total, page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const animal = await Animal.create(body)
    return NextResponse.json({ data: animal }, { status: 201 })
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string }
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Tag ID already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
