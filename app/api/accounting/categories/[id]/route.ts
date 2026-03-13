import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { ExpenseCategory } from '@/models/ExpenseCategory'
import { Expense } from '@/models/Expense'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const category = await ExpenseCategory.findById(id).lean()
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ data: category })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const category = await ExpenseCategory.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    return NextResponse.json({ data: category })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const count = await Expense.countDocuments({ categoryId: id })
    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${count} expense${count !== 1 ? 's' : ''} use this category` },
        { status: 400 }
      )
    }
    await ExpenseCategory.findByIdAndDelete(id)
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
