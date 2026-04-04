import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { FarmAsset } from '@/models/FarmAsset'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)

    const filter: Record<string, unknown> = {}

    const status = searchParams.get('status')
    if (status) filter.status = status

    const category = searchParams.get('category')
    if (category) filter.assetCategory = category

    const assets = await FarmAsset.find(filter)
      .sort({ placedInServiceDate: -1 })
      .lean()

    return NextResponse.json({ data: assets })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()

    // Compute costBasis server-side
    const acquisitionCost = Number(body.acquisitionCost) || 0
    const freightInstallation = Number(body.freightInstallation) || 0
    const otherBasisCosts = Number(body.otherBasisCosts) || 0
    body.costBasis = acquisitionCost + freightInstallation + otherBasisCosts

    const asset = await FarmAsset.create(body)
    return NextResponse.json({ data: asset }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
