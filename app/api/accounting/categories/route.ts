import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ExpenseCategory } from '@/models/ExpenseCategory'
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/constants'

export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    let categories = await ExpenseCategory.find({ active: true })
      .sort({ type: 1, sortOrder: 1, name: 1 })
      .lean()

    // Seed default categories on first load
    if (categories.length === 0) {
      await ExpenseCategory.insertMany(DEFAULT_EXPENSE_CATEGORIES)
      categories = await ExpenseCategory.find({ active: true })
        .sort({ type: 1, sortOrder: 1, name: 1 })
        .lean()
    }

    return NextResponse.json({ data: categories })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const category = await ExpenseCategory.create(body)
    return NextResponse.json({ data: category }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
