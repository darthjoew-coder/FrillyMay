import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { FarmAsset } from '@/models/FarmAsset'
import { AssetDepreciation } from '@/models/AssetDepreciation'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const asset = await FarmAsset.findById(id).lean()
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: asset })
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

    // Recompute costBasis if cost components provided
    if (body.acquisitionCost !== undefined || body.freightInstallation !== undefined || body.otherBasisCosts !== undefined) {
      const existing = await FarmAsset.findById(id).lean() as any
      const acquisitionCost = Number(body.acquisitionCost ?? existing?.acquisitionCost ?? 0)
      const freightInstallation = Number(body.freightInstallation ?? existing?.freightInstallation ?? 0)
      const otherBasisCosts = Number(body.otherBasisCosts ?? existing?.otherBasisCosts ?? 0)
      body.costBasis = acquisitionCost + freightInstallation + otherBasisCosts
    }

    const asset = await FarmAsset.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: asset })
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
    await AssetDepreciation.deleteMany({ assetId: id })
    await FarmAsset.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
