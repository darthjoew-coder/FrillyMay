'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { ISale } from '@/types'
import { PAYMENT_METHODS, SALE_PRODUCT_TYPES } from '@/lib/constants'

interface SaleFormProps {
  initial?: Partial<ISale>
  editId?: string
}

const today = new Date().toISOString().split('T')[0]

export default function SaleForm({ initial, editId }: SaleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    date: initial?.date ? initial.date.split('T')[0] : today,
    productType: initial?.productType || '',
    totalAmount: initial?.totalAmount?.toString() || '',
    quantity: initial?.quantity?.toString() || '',
    unit: initial?.unit || '',
    unitPrice: initial?.unitPrice?.toString() || '',
    customerName: initial?.customerName || '',
    paymentMethod: initial?.paymentMethod || '',
    referenceNumber: initial?.referenceNumber || '',
    notes: initial?.notes || '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        quantity: form.quantity ? parseFloat(form.quantity) : undefined,
        unitPrice: form.unitPrice ? parseFloat(form.unitPrice) : undefined,
        quantity_undefined: undefined,
      }
      // clean up empty strings
      if (!payload.quantity) delete (payload as Record<string, unknown>).quantity
      if (!payload.unitPrice) delete (payload as Record<string, unknown>).unitPrice
      if (!form.unit) delete (payload as Record<string, unknown>).unit
      if (!form.customerName) delete (payload as Record<string, unknown>).customerName
      if (!form.referenceNumber) delete (payload as Record<string, unknown>).referenceNumber
      delete (payload as Record<string, unknown>).quantity_undefined

      const url = editId ? `/api/accounting/sales/${editId}` : '/api/accounting/sales'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push(`/accounting/sales/${data.data._id}`)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
        <Select
          label="Product Type"
          value={form.productType}
          onChange={e => set('productType', e.target.value)}
          required
          options={SALE_PRODUCT_TYPES}
          placeholder="Select product type"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Total Amount ($)"
          type="number"
          step="0.01"
          min="0"
          value={form.totalAmount}
          onChange={e => set('totalAmount', e.target.value)}
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

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Quantity (optional)"
          type="number"
          step="0.01"
          min="0"
          value={form.quantity}
          onChange={e => set('quantity', e.target.value)}
          placeholder="e.g. 500"
        />
        <Input
          label="Unit (optional)"
          value={form.unit}
          onChange={e => set('unit', e.target.value)}
          placeholder="e.g. lbs, dozen, head"
        />
        <Input
          label="Unit Price (optional)"
          type="number"
          step="0.01"
          min="0"
          value={form.unitPrice}
          onChange={e => set('unitPrice', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Customer Name (optional)"
          value={form.customerName}
          onChange={e => set('customerName', e.target.value)}
          placeholder="e.g. John Smith"
        />
        <Input
          label="Reference # (optional)"
          value={form.referenceNumber}
          onChange={e => set('referenceNumber', e.target.value)}
          placeholder="Check # / invoice #"
        />
      </div>

      <Textarea
        label="Notes (optional)"
        value={form.notes}
        onChange={e => set('notes', e.target.value)}
        placeholder="Any additional notes..."
      />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {editId ? 'Update Sale' : 'Record Sale'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
