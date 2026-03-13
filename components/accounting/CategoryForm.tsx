'use client'
import { useState } from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { IExpenseCategory } from '@/types'

interface CategoryFormProps {
  initial?: Partial<IExpenseCategory>
  editId?: string
  onSaved: () => void
  onCancel: () => void
}

export default function CategoryForm({ initial, editId, onSaved, onCancel }: CategoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'expense',
    scheduleFBucket: initial?.scheduleFBucket || '',
    active: initial?.active !== undefined ? initial.active : true,
    sortOrder: initial?.sortOrder?.toString() || '0',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        type: form.type,
        scheduleFBucket: form.scheduleFBucket,
        active: form.active,
        sortOrder: parseInt(form.sortOrder) || 0,
      }
      const url = editId ? `/api/accounting/categories/${editId}` : '/api/accounting/categories'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSaved()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        {editId ? 'Edit Category' : 'Add Category'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
            placeholder="e.g. Feed"
          />
          <Select
            label="Type"
            value={form.type}
            onChange={e => set('type', e.target.value)}
            required
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
          />
        </div>

        <Input
          label="Schedule F Bucket"
          value={form.scheduleFBucket}
          onChange={e => set('scheduleFBucket', e.target.value)}
          required
          placeholder="e.g. Line 10 - Feed"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Sort Order"
            type="number"
            value={form.sortOrder}
            onChange={e => set('sortOrder', e.target.value)}
            placeholder="0"
          />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={loading}>
            {editId ? 'Update' : 'Add Category'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
