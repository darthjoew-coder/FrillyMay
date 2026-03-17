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

interface PendingReceipt {
  _id: string
  merchantName?: string
  receiptDate?: string
  totalAmount?: number
  category?: string
  status?: string
  createdAt: string
  thumbnailBase64?: string
}

const currentYear = new Date().getFullYear()

function fmtDate(str?: string) {
  if (!str) return '—'
  try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return str }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpense[]>([])
  const [categories, setCategories] = useState<IExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vendor: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pendingReceipts, setPendingReceipts] = useState<PendingReceipt[]>([])

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
    fetch('/api/accounting/receipts')
      .then(r => r.json())
      .then(d => setPendingReceipts(d.data || []))
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

        {/* Pending mobile receipts */}
        {pendingReceipts.length > 0 && (
          <div className="mb-6 border border-amber-200 rounded-xl bg-amber-50 p-4">
            <h2 className="text-sm font-semibold text-amber-800 mb-3">
              📱 {pendingReceipts.length} unprocessed mobile receipt{pendingReceipts.length !== 1 ? 's' : ''} — review and link to an expense
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pendingReceipts.map(r => (
                <a
                  key={r._id}
                  href={`/api/accounting/receipts/${r._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white border border-amber-200 rounded-lg p-3 hover:border-amber-400 transition-colors"
                >
                  {r.thumbnailBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.thumbnailBase64} alt="receipt" className="w-12 h-12 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-amber-100 rounded shrink-0 flex items-center justify-center text-xl">🧾</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.merchantName || 'Unknown merchant'}</p>
                    <p className="text-xs text-gray-500">{fmtDate(r.receiptDate || r.createdAt)}</p>
                    {r.totalAmount != null && (
                      <p className="text-xs font-semibold text-gray-700">
                        {r.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

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
