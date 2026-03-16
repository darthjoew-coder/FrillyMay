'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { ICustomer } from '@/types'
import { CUSTOMER_TAGS, US_STATES } from '@/lib/constants'

interface CustomerFormProps {
  initial?: Partial<ICustomer>
  editId?: string
}

export default function CustomerForm({ initial, editId }: CustomerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    businessName: initial?.businessName || '',
    displayName: initial?.displayName || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    addressLine1: initial?.addressLine1 || '',
    addressLine2: initial?.addressLine2 || '',
    city: initial?.city || '',
    state: initial?.state || '',
    zip: initial?.zip || '',
    notes: initial?.notes || '',
    tags: initial?.tags || [] as string[],
    isActive: initial?.isActive ?? true,
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        displayName: form.displayName || form.businessName || `${form.firstName} ${form.lastName}`.trim(),
      }
      // strip empty strings for optional fields
      const optionalFields = ['businessName', 'displayName', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'zip', 'notes']
      for (const f of optionalFields) {
        if (!(payload as Record<string, unknown>)[f]) {
          delete (payload as Record<string, unknown>)[f]
        }
      }

      const url = editId ? `/api/customers/${editId}` : '/api/customers'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push(`/customers/${data.data._id}`)
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
        <Input label="First Name" value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Jane" />
        <Input label="Last Name" value={form.lastName} onChange={e => set('lastName', e.target.value)} required placeholder="Smith" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Business Name (optional)" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Smith Family Farm" />
        <Input label="Display Name (optional)" value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="Auto-generated if blank" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Email (optional)" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
        <Input label="Phone (optional)" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 123-4567" />
      </div>

      <div>
        <Input label="Address Line 1 (optional)" value={form.addressLine1} onChange={e => set('addressLine1', e.target.value)} placeholder="123 Main St" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Springfield" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            value={form.state}
            onChange={e => set('state', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">—</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Input label="ZIP" value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="12345" />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tags (optional)</p>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_TAGS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTag(t.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                form.tags.includes(t.value)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Textarea label="Notes (optional)" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes about this customer…" />

      {editId && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">Active (uncheck to deactivate)</label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>{editId ? 'Update Customer' : 'Add Customer'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
