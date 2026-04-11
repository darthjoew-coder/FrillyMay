'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { IFarmAsset } from '@/types'
import { ASSET_CATEGORIES, DEPRECIATION_METHODS, MACRS_USEFUL_LIFE_OPTIONS, ASSET_STATUSES } from '@/lib/constants'

interface AssetFormProps {
  initial?: Partial<IFarmAsset>
  editId?: string
  fromExpenseId?: string
}

const today = new Date().toISOString().split('T')[0]

export default function AssetForm({ initial, editId, fromExpenseId }: AssetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    assetCategory: initial?.assetCategory || 'machinery_equipment',
    placedInServiceDate: initial?.placedInServiceDate
      ? initial.placedInServiceDate.split('T')[0]
      : today,
    acquisitionCost: initial?.acquisitionCost?.toString() || '',
    freightInstallation: initial?.freightInstallation?.toString() || '0',
    otherBasisCosts: initial?.otherBasisCosts?.toString() || '0',
    salvageValue: initial?.salvageValue?.toString() || '0',
    usefulLifeYears: initial?.usefulLifeYears?.toString() || '7',
    depreciationMethod: initial?.depreciationMethod || 'macrs',
    section179Amount: initial?.section179Amount?.toString() || '0',
    bonusDepreciationPct: initial?.bonusDepreciationPct?.toString() || '0',
    status: initial?.status || 'active',
    disposalDate: initial?.disposalDate ? initial.disposalDate.split('T')[0] : '',
    disposalAmount: initial?.disposalAmount?.toString() || '',
    vendor: initial?.vendor || '',
    serialNumber: initial?.serialNumber || '',
    location: initial?.location || '',
    notes: initial?.notes || '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const acquisitionCost = parseFloat(form.acquisitionCost) || 0
  const freightInstallation = parseFloat(form.freightInstallation) || 0
  const otherBasisCosts = parseFloat(form.otherBasisCosts) || 0
  const costBasis = acquisitionCost + freightInstallation + otherBasisCosts

  const selectedCategory = ASSET_CATEGORIES.find(c => c.value === form.assetCategory)
  const isSection179 = form.depreciationMethod === 'section_179'
  const isBonus = form.depreciationMethod === 'bonus'
  const isNotDepreciable = form.depreciationMethod === 'not_depreciable'
  const isDisposed = form.status === 'disposed'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        assetCategory: form.assetCategory,
        placedInServiceDate: form.placedInServiceDate,
        acquisitionCost: parseFloat(form.acquisitionCost) || 0,
        freightInstallation: parseFloat(form.freightInstallation) || 0,
        otherBasisCosts: parseFloat(form.otherBasisCosts) || 0,
        salvageValue: parseFloat(form.salvageValue) || 0,
        usefulLifeYears: parseFloat(form.usefulLifeYears) || 7,
        depreciationMethod: form.depreciationMethod,
        section179Amount: parseFloat(form.section179Amount) || 0,
        bonusDepreciationPct: parseFloat(form.bonusDepreciationPct) || 0,
        status: form.status,
        vendor: form.vendor || undefined,
        serialNumber: form.serialNumber || undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
      }
      if (isDisposed && form.disposalDate) payload.disposalDate = form.disposalDate
      if (isDisposed && form.disposalAmount) payload.disposalAmount = parseFloat(form.disposalAmount)

      const url = editId ? `/api/accounting/assets/${editId}` : '/api/accounting/assets'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      const assetId: string = data.data._id
      // If converting from an expense, delete the original expense record
      if (fromExpenseId) {
        await fetch(`/api/accounting/expenses/${fromExpenseId}`, { method: 'DELETE' })
      }
      router.push(`/accounting/assets/${assetId}`)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {fromExpenseId && (
        <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Converting from expense</p>
          <p className="mt-1">
            When you save this asset, the original expense record will be permanently deleted and replaced
            by this capital asset. Review the pre-filled details below before saving.
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <Input
          label="Asset Name"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
          placeholder="e.g. John Deere 5075E Tractor"
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Category"
            value={form.assetCategory}
            onChange={e => set('assetCategory', e.target.value)}
            required
            options={ASSET_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
          />
          <Input
            label="Placed in Service Date"
            type="date"
            value={form.placedInServiceDate}
            onChange={e => set('placedInServiceDate', e.target.value)}
            required
          />
        </div>

        {selectedCategory && (
          <p className="text-xs text-gray-500 -mt-4">{selectedCategory.description}</p>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Acquisition Cost ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.acquisitionCost}
            onChange={e => set('acquisitionCost', e.target.value)}
            required
            placeholder="0.00"
          />
          <Input
            label="Freight & Installation ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.freightInstallation}
            onChange={e => set('freightInstallation', e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Other Basis Costs ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.otherBasisCosts}
            onChange={e => set('otherBasisCosts', e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-gray-600">Computed cost basis: </span>
          <span className="font-semibold text-gray-900">
            {costBasis.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
          <span className="text-xs text-gray-500 ml-2">(acquisition + freight + other costs)</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Depreciation Method"
            value={form.depreciationMethod}
            onChange={e => set('depreciationMethod', e.target.value)}
            required
            options={DEPRECIATION_METHODS.map(m => ({ value: m.value, label: m.label }))}
          />
          {!isNotDepreciable && (
            <Select
              label="Useful Life (Recovery Period)"
              value={form.usefulLifeYears}
              onChange={e => set('usefulLifeYears', e.target.value)}
              required
              options={MACRS_USEFUL_LIFE_OPTIONS}
            />
          )}
        </div>

        {isSection179 && (
          <Input
            label="Section 179 Amount ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.section179Amount}
            onChange={e => set('section179Amount', e.target.value)}
            placeholder="Full cost basis for 100% §179"
          />
        )}

        {isBonus && (
          <Input
            label="Bonus Depreciation % (e.g. 100 for 100%)"
            type="number"
            step="1"
            min="0"
            max="100"
            value={form.bonusDepreciationPct}
            onChange={e => set('bonusDepreciationPct', e.target.value)}
            placeholder="100"
          />
        )}

        {!isNotDepreciable && (
          <Input
            label="Salvage Value ($)"
            type="number"
            step="0.01"
            min="0"
            value={form.salvageValue}
            onChange={e => set('salvageValue', e.target.value)}
            placeholder="0 (most MACRS assets use 0)"
          />
        )}

        <Select
          label="Status"
          value={form.status}
          onChange={e => set('status', e.target.value)}
          options={ASSET_STATUSES}
        />

        {isDisposed && (
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Disposal Date"
              type="date"
              value={form.disposalDate}
              onChange={e => set('disposalDate', e.target.value)}
            />
            <Input
              label="Disposal Amount ($)"
              type="number"
              step="0.01"
              min="0"
              value={form.disposalAmount}
              onChange={e => set('disposalAmount', e.target.value)}
              placeholder="Sale / trade-in proceeds"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Vendor / Seller (optional)"
            value={form.vendor}
            onChange={e => set('vendor', e.target.value)}
            placeholder="e.g. Farm Equipment Co."
          />
          <Input
            label="Serial / VIN (optional)"
            value={form.serialNumber}
            onChange={e => set('serialNumber', e.target.value)}
            placeholder="Serial or VIN number"
          />
        </div>

        <Input
          label="Location (optional)"
          value={form.location}
          onChange={e => set('location', e.target.value)}
          placeholder="e.g. North barn, Field #2"
        />

        <Textarea
          label="Notes (optional)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Additional notes..."
        />

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            {editId ? 'Update Asset' : fromExpenseId ? 'Save Asset & Delete Expense' : 'Add Asset'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
