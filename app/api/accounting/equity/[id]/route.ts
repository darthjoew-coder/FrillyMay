import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { OwnerEquity } from '@/models/OwnerEquity'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const record = await OwnerEquity.findById(id).lean()
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: record })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    if (body.date) body.taxYear = new Date(body.date).getFullYear()
    const record = await OwnerEquity.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: record })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    await OwnerEquity.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
