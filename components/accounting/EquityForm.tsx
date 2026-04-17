'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { IOwnerEquity } from '@/types'
import { PAYMENT_METHODS } from '@/lib/constants'

interface EquityFormProps {
  initial?: Partial<IOwnerEquity>
  editId?: string
}

const today = new Date().toISOString().split('T')[0]

export default function EquityForm({ initial, editId }: EquityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: initial?.type || 'contribution',
    amount: initial?.amount?.toString() || '',
    date: initial?.date ? (initial.date as string).split('T')[0] : today,
    description: initial?.description || '',
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
        type: form.type,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description || undefined,
        paymentMethod: form.paymentMethod || undefined,
        referenceNumber: form.referenceNumber || undefined,
        notes: form.notes || undefined,
      }
      const url = editId ? `/api/accounting/equity/${editId}` : '/api/accounting/equity'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push('/accounting/equity')
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const isContribution = form.type === 'contribution'

  return (
    <div className="max-w-xl space-y-6">
      {isContribution ? (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <p className="font-semibold">Owner Contribution</p>
          <p className="mt-0.5">Money or assets you put into the business. Increases your equity basis. Not taxable income — does not appear on Schedule F.</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Owner Draw</p>
          <p className="mt-0.5">Money or assets you take out of the business. Reduces your equity basis. Not a deductible expense — does not appear on Schedule F.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Transaction Type"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            required
            options={[
              { value: 'contribution', label: 'Owner Contribution' },
              { value: 'draw', label: 'Owner Draw' },
            ]}
          />
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            required
          />
        </div>

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

        <Input
          label="Description (optional)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder={isContribution ? 'e.g. Annual capital injection' : 'e.g. Monthly personal draw'}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Payment Method (optional)"
            value={form.paymentMethod}
            onChange={e => set('paymentMethod', e.target.value)}
            options={PAYMENT_METHODS}
            placeholder="Select method"
          />
          <Input
            label="Reference # (optional)"
            value={form.referenceNumber}
            onChange={e => set('referenceNumber', e.target.value)}
            placeholder="Check # or transfer ID"
          />
        </div>

        <Textarea
          label="Notes (optional)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Additional notes..."
        />

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {editId ? 'Update' : isContribution ? 'Record Contribution' : 'Record Draw'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
