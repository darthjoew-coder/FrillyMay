import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { AnimalSale } from '@/models/AnimalSale'
import { AnimalPurchase } from '@/models/AnimalPurchase'
import { Animal } from '@/models/Animal'
import mongoose from 'mongoose'
import type { AnimalClassification } from '@/models/Animal'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB()
    const { id } = await params
    const record = await AnimalSale.findOne({ animalId: id }).lean()
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

    // Load animal to snapshot classification at sale time
    const animal = await Animal.findById(id).lean() as Record<string, unknown> | null
    if (!animal) return NextResponse.json({ error: 'Animal not found' }, { status: 404 })

    const classification = (animal.classification as AnimalClassification) || 'review_needed'
    const saleDate = new Date(body.saleDate)
    const taxYear = saleDate.getFullYear()
    const saleAmount = Number(body.saleAmount) || 0

    // For resale_inventory animals, look up the deferred cost basis from AnimalPurchase.
    // For all other classifications, cost basis is 0.
    let costBasis = 0
    if (classification === 'resale_inventory') {
      const purchase = await AnimalPurchase.findOne({ animalId: id }).lean() as Record<string, unknown> | null
      costBasis = purchase ? Number(purchase.costBasis) || 0 : 0
    }

    const record = await AnimalSale.findOneAndUpdate(
      { animalId: new mongoose.Types.ObjectId(id) },
      {
        animalId: new mongoose.Types.ObjectId(id),
        saleDate,
        taxYear,
        saleAmount,
        costBasis,
        // Snapshot classification so Schedule F is accurate even if animal record changes later
        classificationAtSale: classification,
        buyerName: body.buyerName || undefined,
        saleType: body.saleType || undefined,
        notes: body.notes || undefined,
      },
      { upsert: true, new: true, runValidators: true }
    ).lean()

    // Mark animal as sold
    await Animal.findByIdAndUpdate(id, {
      status: 'sold',
      statusDate: saleDate,
      statusNotes: body.notes || undefined,
    })

    return NextResponse.json({ data: record }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await connectDB()
    const { id } = await params
    await AnimalSale.findOneAndDelete({ animalId: id })
    // Restore animal status to active
    await Animal.findByIdAndUpdate(id, { status: 'active', statusDate: null, statusNotes: null })
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
