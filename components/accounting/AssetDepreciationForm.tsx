'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { DEPRECIATION_METHODS } from '@/lib/constants'

interface AssetDepreciationFormProps {
  assetId: string
  costBasis: number
  method: string
  existingYears: number[]
}

const currentYear = new Date().getFullYear()

export default function AssetDepreciationForm({
  assetId,
  costBasis,
  method,
  existingYears,
}: AssetDepreciationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    taxYear: String(currentYear),
    depreciationAmount: '',
    method: method,
    basisAtStartOfYear: String(costBasis),
    accumulatedDepreciation: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        taxYear: parseInt(form.taxYear),
        depreciationAmount: parseFloat(form.depreciationAmount) || 0,
        method: form.method,
        basisAtStartOfYear: parseFloat(form.basisAtStartOfYear) || 0,
        accumulatedDepreciation: parseFloat(form.accumulatedDepreciation) || 0,
        notes: form.notes || undefined,
      }
      const res = await fetch(`/api/accounting/assets/${assetId}/depreciation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSuccess(`Depreciation record for ${form.taxYear} saved.`)
      setForm(f => ({ ...f, depreciationAmount: '', accumulatedDepreciation: '', notes: '' }))
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear - 10 + i).map(y => ({
    value: String(y),
    label: existingYears.includes(y) ? `${y} (recorded)` : String(y),
  }))

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Record Depreciation for a Tax Year</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">{success}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tax Year"
            value={form.taxYear}
            onChange={e => set('taxYear', e.target.value)}
            options={yearOptions}
          />
          <Select
            label="Method"
            value={form.method}
            onChange={e => set('method', e.target.value)}
            options={DEPRECIATION_METHODS.filter(m => m.value !== 'not_depreciable').map(m => ({ value: m.value, label: m.label }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Basis at Start of Year ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.basisAtStartOfYear}
            onChange={e => set('basisAtStartOfYear', e.target.value)}
            required
          />
          <Input
            label="Depreciation Deduction ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.depreciationAmount}
            onChange={e => set('depreciationAmount', e.target.value)}
            required
            placeholder="0.00"
          />
          <Input
            label="Accumulated Depreciation ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.accumulatedDepreciation}
            onChange={e => set('accumulatedDepreciation', e.target.value)}
            required
            placeholder="Total through this year"
          />
        </div>

        <Input
          label="Notes (optional)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="e.g. MACRS 7-yr half-year convention, Year 1 rate 14.29%"
        />

        <Button type="submit" loading={loading}>
          Save Depreciation Record
        </Button>
      </form>
    </div>
  )
}
