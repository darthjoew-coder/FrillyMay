'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { IExpense, IExpenseCategory, IReceipt } from '@/types'
import { PAYMENT_METHODS, PRODUCT_LINES } from '@/lib/constants'

interface ExpenseFormProps {
  initial?: Partial<IExpense>
  editId?: string
}

const today = new Date().toISOString().split('T')[0]

export default function ExpenseForm({ initial, editId }: ExpenseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<IExpenseCategory[]>([])
  const [receipts, setReceipts] = useState<IReceipt[]>([])
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [form, setForm] = useState({
    date: initial?.date ? initial.date.split('T')[0] : today,
    vendor: initial?.vendor || '',
    amount: initial?.amount?.toString() || '',
    categoryId: initial?.categoryId || '',
    subcategory: initial?.subcategory || '',
    paymentMethod: initial?.paymentMethod || '',
    productLine: initial?.productLine || '',
    description: initial?.description || '',
    notes: initial?.notes || '',
    status: initial?.status || 'draft',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const taxYear = form.date ? new Date(form.date + 'T00:00:00').getFullYear() : new Date().getFullYear()

  useEffect(() => {
    fetch('/api/accounting/categories?type=expense')
      .then(r => r.json())
      .then(d => setCategories(d.data || []))
  }, [])

  useEffect(() => {
    if (editId) {
      fetch(`/api/accounting/expenses/${editId}`)
        .then(r => r.json())
        .then(d => setReceipts(d.data?.receipts || []))
    }
  }, [editId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        taxYear,
      }
      const url = editId ? `/api/accounting/expenses/${editId}` : '/api/accounting/expenses'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      const savedId: string = data.data._id
      if (uploadFile && !editId) {
        try {
          const fd = new FormData()
          fd.append('file', uploadFile)
          fd.append('expenseId', savedId)
          await fetch('/api/accounting/receipts', { method: 'POST', body: fd })
        } catch { /* don't block navigation */ }
      }
      router.push(`/accounting/expenses/${savedId}`)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload() {
    if (!uploadFile || !editId) return
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('expenseId', editId)
      const res = await fetch('/api/accounting/receipts', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setUploadFile(null)
      // refresh receipts
      const r2 = await fetch(`/api/accounting/expenses/${editId}`)
      const d2 = await r2.json()
      setReceipts(d2.data?.receipts || [])
    } catch (err: unknown) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteReceipt(receiptId: string) {
    if (!editId) return
    await fetch(`/api/accounting/receipts/${receiptId}`, { method: 'DELETE' })
    const r2 = await fetch(`/api/accounting/expenses/${editId}`)
    const d2 = await r2.json()
    setReceipts(d2.data?.receipts || [])
  }

  const categoryOptions = categories.map(c => ({ value: c._id, label: c.name }))

  return (
    <div className="space-y-8 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Year</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
              {taxYear}
            </div>
          </div>
        </div>

        <Input
          label="Vendor"
          value={form.vendor}
          onChange={e => set('vendor', e.target.value)}
          required
          placeholder="e.g. Tractor Supply Co."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Amount ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            required
            placeholder="0.00"
          />
          <Select
            label="Payment Method"
            value={form.paymentMethod}
            onChange={e => set('paymentMethod', e.target.value)}
            required
            options={PAYMENT_METHODS}
            placeholder="Select method"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.categoryId}
            onChange={e => set('categoryId', e.target.value)}
            required
            options={categoryOptions}
            placeholder="Select category"
          />
          <Input
            label="Subcategory (optional)"
            value={form.subcategory}
            onChange={e => set('subcategory', e.target.value)}
            placeholder="e.g. Hay, Minerals"
          />
        </div>

        <Select
          label="Product Line"
          value={form.productLine}
          onChange={e => set('productLine', e.target.value)}
          required
          options={PRODUCT_LINES}
          placeholder="Select product line"
        />

        <Select
          label="Status"
          value={form.status}
          onChange={e => set('status', e.target.value)}
          options={[
            { value: 'draft', label: 'Draft' },
            { value: 'finalized', label: 'Finalized' },
          ]}
        />

        <Input
          label="Description (optional)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Brief description of the expense"
        />

        <Textarea
          label="Notes (optional)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any additional notes..."
        />

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {editId ? 'Update Expense' : 'Log Expense'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      <div className="border border-gray-200 rounded-lg p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Receipt</h3>

        {editId && receipts.length > 0 && (
          <ul className="space-y-2">
            {receipts.map(r => (
              <li key={r._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <a
                    href={`/api/accounting/receipts/${r._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {r.fileName}
                  </a>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.source === 'mobile' ? (
                      <>Mobile capture{r.merchantName ? ` · ${r.merchantName}` : ''}</>
                    ) : (
                      <>{(r.imageSize / 1024).toFixed(1)} KB &middot; {r.imageMimeType}</>
                    )}
                  </p>
                </div>
                <Button type="button" variant="danger" onClick={() => handleDeleteReceipt(r._id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}

        {editId && receipts.length === 0 && (
          <p className="text-sm text-gray-500">No receipts attached.</p>
        )}

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{uploadError}</div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={e => setUploadFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
          />
          {editId && (
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={handleUpload}
              disabled={!uploadFile}
            >
              Upload Receipt
            </Button>
          )}
        </div>

        {!editId && uploadFile && (
          <p className="text-xs text-green-700">✓ {uploadFile.name} will be attached after saving</p>
        )}
      </div>
    </div>
  )
}
