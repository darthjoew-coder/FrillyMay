import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { AnimalPurchase } from '@/models/AnimalPurchase'
import { Animal } from '@/models/Animal'
import mongoose from 'mongoose'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB()
    const { id } = await params
    const record = await AnimalPurchase.findOne({ animalId: id }).lean()
    return NextResponse.json({ data: record || null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    // Validate animal exists
    const animal = await Animal.findById(id).lean()
    if (!animal) return NextResponse.json({ error: 'Animal not found' }, { status: 404 })

    const purchasePrice = Number(body.purchasePrice) || 0
    const truckingCost = Number(body.truckingCost) || 0
    const otherCosts = Number(body.otherCosts) || 0
    // Cost basis = purchase price + trucking + other acquisition costs.
    // Feed, vet, and care costs are NEVER included per IRS rules.
    const costBasis = purchasePrice + truckingCost + otherCosts

    const record = await AnimalPurchase.findOneAndUpdate(
      { animalId: new mongoose.Types.ObjectId(id) },
      {
        animalId: new mongoose.Types.ObjectId(id),
        purchaseDate: body.purchaseDate,
        purchasePrice,
        truckingCost,
        otherCosts,
        costBasis,
        sellerName: body.sellerName || undefined,
        referenceNumber: body.referenceNumber || undefined,
        notes: body.notes || undefined,
      },
      { upsert: true, new: true, runValidators: true }
    ).lean()

    return NextResponse.json({ data: record }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB()
    const { id } = await params
    await AnimalPurchase.findOneAndDelete({ animalId: id })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
