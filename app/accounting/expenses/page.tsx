'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import ExpenseTable from '@/components/accounting/ExpenseTable'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { IExpense, IExpenseCategory } from '@/types'
import { PRODUCT_LINES, EXPENSE_STATUSES } from '@/lib/constants'

const currentYear = new Date().getFullYear()

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpense[]>([])
  const [categories, setCategories] = useState<IExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vendor: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [year, setYear] = useState(String(currentYear))
  const [categoryId, setCategoryId] = useState('')
  const [productLine, setProductLine] = useState('')
  const [status, setStatus] = useState('')
  const [vendor, setVendor] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetch('/api/accounting/categories')
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
  }, [])

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (year) params.set('year', year)
    if (categoryId) params.set('categoryId', categoryId)
    if (productLine) params.set('productLine', productLine)
    if (status) params.set('status', status)
    if (vendor) params.set('vendor', vendor)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const res = await fetch(`/api/accounting/expenses?${params}`)
    const data = await res.json()
    setExpenses(data.data || [])
    setLoading(false)
  }, [year, categoryId, productLine, status, vendor, dateFrom, dateTo])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/accounting/expenses/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchExpenses()
  }

  const yearOptions = [-2, -1, 0, 1, 2].map(o => ({
    value: String(currentYear + o),
    label: String(currentYear + o),
  }))

  const categoryOptions = categories.map(c => ({ value: c._id, label: c.name }))

  return (
    <>
      <TopBar
        title="Expenses"
        subtitle={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
        actions={<Link href="/accounting/expenses/new"><Button>+ Log Expense</Button></Link>}
      />
      <PageWrapper>
        <div className="flex gap-3 mb-6 flex-wrap items-end">
          <div className="w-28">
            <Select value={year} onChange={e => setYear(e.target.value)} options={yearOptions} label="Year" />
          </div>
          <div className="w-44">
            <Select value={categoryId} onChange={e => setCategoryId(e.target.value)} options={categoryOptions} placeholder="All categories" label="Category" />
          </div>
          <div className="w-36">
            <Select value={productLine} onChange={e => setProductLine(e.target.value)} options={PRODUCT_LINES} placeholder="All lines" label="Product Line" />
          </div>
          <div className="w-32">
            <Select value={status} onChange={e => setStatus(e.target.value)} options={EXPENSE_STATUSES} placeholder="All statuses" label="Status" />
          </div>
          <div className="w-44">
            <Input placeholder="Search vendor..." value={vendor} onChange={e => setVendor(e.target.value)} label="Vendor" />
          </div>
          <div className="w-36">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} label="From" />
          </div>
          <div className="w-36">
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} label="To" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description="Log your first expense to get started."
            actionLabel="Log Expense"
            actionHref="/accounting/expenses/new"
            icon="🧾"
          />
        ) : (
          <ExpenseTable expenses={expenses} onDelete={(id, vendor) => setDeleteTarget({ id, vendor })} />
        )}
      </PageWrapper>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        confirmLabel="Delete Expense"
        confirmVariant="danger"
        loading={deleting}
        description={`This will permanently delete the expense from "${deleteTarget?.vendor}". This cannot be undone.`}
      />
    </>
  )
}
