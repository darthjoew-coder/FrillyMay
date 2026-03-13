import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import ExpenseForm from '@/components/accounting/ExpenseForm'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const expense = await Expense.findById(id).populate('categoryId').lean()
  if (!expense) notFound()

  const e = expense as unknown as Record<string, unknown>
  const category = e.categoryId as Record<string, unknown> | null

  // Flatten for form initial values
  const initial = {
    _id: String(e._id),
    date: e.date ? String(e.date).split('T')[0] : '',
    vendor: String(e.vendor || ''),
    amount: e.amount as number,
    categoryId: category ? String(category._id) : String(e.categoryId || ''),
    subcategory: String(e.subcategory || ''),
    paymentMethod: String(e.paymentMethod || '') as never,
    productLine: String(e.productLine || '') as never,
    description: String(e.description || ''),
    notes: String(e.notes || ''),
    taxYear: e.taxYear as number,
    status: String(e.status || 'draft') as never,
    createdAt: String(e.createdAt || ''),
    updatedAt: String(e.updatedAt || ''),
  }

  return (
    <>
      <TopBar title="Edit Expense" subtitle={`Editing expense from ${initial.vendor}`} />
      <PageWrapper>
        <ExpenseForm initial={initial} editId={id} />
      </PageWrapper>
    </>
  )
}
