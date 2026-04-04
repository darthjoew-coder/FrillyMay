import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { AssetDepreciation } from '@/models/AssetDepreciation'
import { FarmAsset } from '@/models/FarmAsset'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const records = await AssetDepreciation.find({ assetId: id })
      .sort({ taxYear: 1 })
      .lean()
    return NextResponse.json({ data: records })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    const asset = await FarmAsset.findById(id)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    // Upsert: one record per asset per tax year
    const record = await AssetDepreciation.findOneAndUpdate(
      { assetId: id, taxYear: body.taxYear },
      { ...body, assetId: id },
      { new: true, upsert: true, runValidators: true }
    ).lean()

    return NextResponse.json({ data: record }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const taxYear = searchParams.get('taxYear')
    if (!taxYear) return NextResponse.json({ error: 'taxYear required' }, { status: 400 })
    await AssetDepreciation.deleteOne({ assetId: id, taxYear: Number(taxYear) })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
