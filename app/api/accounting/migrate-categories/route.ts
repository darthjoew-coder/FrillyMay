import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ExpenseCategory } from '@/models/ExpenseCategory'

/**
 * One-time migration: set capitalizable=true on categories that represent
 * long-lived assets and add any missing capitalizable categories.
 * GET /api/accounting/migrate-categories
 */

const CAPITALIZABLE_NAMES = [
  'Depreciable Equipment',
  'Repairs & Maintenance',
]

const NEW_CAPITALIZABLE_CATEGORIES = [
  { name: 'Land Improvements', type: 'expense', scheduleFBucket: 'Depreciation and Section 179 (Line 14d)', sortOrder: 22, capitalizable: true },
  { name: 'Buildings & Structures', type: 'expense', scheduleFBucket: 'Depreciation and Section 179 (Line 14d)', sortOrder: 23, capitalizable: true },
  { name: 'Breeding Livestock', type: 'expense', scheduleFBucket: 'Depreciation and Section 179 (Line 14d)', sortOrder: 24, capitalizable: true },
  { name: 'Vehicles', type: 'expense', scheduleFBucket: 'Depreciation and Section 179 (Line 14d)', sortOrder: 25, capitalizable: true },
  { name: 'Orchard / Vineyard', type: 'expense', scheduleFBucket: 'Depreciation and Section 179 (Line 14d)', sortOrder: 26, capitalizable: true },
]

export async function GET() {
  try {
    await connectDB()

    // Set capitalizable=true on existing categories by name
    const flagResult = await ExpenseCategory.updateMany(
      { name: { $in: CAPITALIZABLE_NAMES } },
      { $set: { capitalizable: true } }
    )

    // Also flag "Depreciable Equipment" which is the main one
    await ExpenseCategory.updateMany(
      { scheduleFBucket: { $regex: 'Depreciation', $options: 'i' } },
      { $set: { capitalizable: true } }
    )

    // Add missing capitalizable categories (skip if name already exists)
    const results: string[] = []
    for (const cat of NEW_CAPITALIZABLE_CATEGORIES) {
      const existing = await ExpenseCategory.findOne({ name: cat.name, type: cat.type })
      if (!existing) {
        await ExpenseCategory.create(cat)
        results.push(`Created: ${cat.name}`)
      } else {
        await ExpenseCategory.updateOne({ _id: existing._id }, { $set: { capitalizable: true } })
        results.push(`Updated: ${cat.name}`)
      }
    }

    return NextResponse.json({
      success: true,
      flaggedExisting: flagResult.modifiedCount,
      categories: results,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
