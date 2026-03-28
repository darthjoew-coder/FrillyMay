'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { IAnimal } from '@/types'
import {
  SPECIES_OPTIONS,
  ANIMAL_STATUSES,
  SEX_OPTIONS,
  ANIMAL_CLASSIFICATIONS,
  ACQUISITION_METHODS,
} from '@/lib/constants'

interface AnimalFormProps {
  initial?: Partial<IAnimal>
  editId?: string
}

export default function AnimalForm({ initial, editId }: AnimalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    tagId: initial?.tagId || '',
    name: initial?.name || '',
    species: initial?.species || '',
    breed: initial?.breed || '',
    sex: initial?.sex || '',
    dateOfBirth: initial?.dateOfBirth ? initial.dateOfBirth.split('T')[0] : '',
    acquisitionDate: initial?.acquisitionDate ? initial.acquisitionDate.split('T')[0] : '',
    acquisitionSource: initial?.acquisitionSource || '',
    acquisitionMethod: initial?.acquisitionMethod || 'other',
    classification: initial?.classification || 'review_needed',
    intendedUse: initial?.intendedUse || '',
    currentWeight: initial?.currentWeight?.toString() || '',
    status: initial?.status || 'active',
    location: initial?.location || '',
    color: initial?.color || '',
    notes: initial?.notes || '',
  })

  // Purchase record fields – only shown for purchased/resale animals
  const [purchaseForm, setPurchaseForm] = useState({
    purchaseDate: initial?.acquisitionDate ? initial.acquisitionDate.split('T')[0] : '',
    purchasePrice: '',
    truckingCost: '',
    otherCosts: '',
    sellerName: initial?.acquisitionSource || '',
    referenceNumber: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const setP = (k: string, v: string) => setPurchaseForm(f => ({ ...f, [k]: v }))

  const isPurchased = form.acquisitionMethod === 'purchased'
  const isResaleInventory = form.classification === 'resale_inventory'
  const showPurchaseFields = isPurchased && isResaleInventory

  // Helper to resolve the Schedule F hint text
  const classificationHint = ANIMAL_CLASSIFICATIONS.find(c => c.value === form.classification)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        currentWeight: form.currentWeight ? parseFloat(form.currentWeight) : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        acquisitionDate: form.acquisitionDate || undefined,
        intendedUse: form.intendedUse || undefined,
      }
      const url = editId ? `/api/animals/${editId}` : '/api/animals'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      const animalId: string = data.data._id

      // Save purchase record if applicable
      if (showPurchaseFields && purchaseForm.purchasePrice) {
        await fetch(`/api/animals/${animalId}/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseDate: purchaseForm.purchaseDate || form.acquisitionDate || new Date().toISOString().split('T')[0],
            purchasePrice: parseFloat(purchaseForm.purchasePrice) || 0,
            truckingCost: parseFloat(purchaseForm.truckingCost) || 0,
            otherCosts: parseFloat(purchaseForm.otherCosts) || 0,
            sellerName: purchaseForm.sellerName || undefined,
            referenceNumber: purchaseForm.referenceNumber || undefined,
            notes: purchaseForm.notes || undefined,
          }),
        })
      }

      router.push(`/animals/${animalId}`)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Basic identification */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Tag / ID" value={form.tagId} onChange={e => set('tagId', e.target.value)} required placeholder="e.g. COW-001" />
        <Input label="Name (optional)" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Bessie" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Species" value={form.species} onChange={e => set('species', e.target.value)} required
          options={SPECIES_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          placeholder="Select species" />
        <Input label="Breed" value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="e.g. Angus" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Sex" value={form.sex} onChange={e => set('sex', e.target.value)} required
          options={SEX_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          placeholder="Select sex" />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} required
          options={ANIMAL_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
        <Input label="Weight (kg)" type="number" min="0" step="0.1" value={form.currentWeight} onChange={e => set('currentWeight', e.target.value)} placeholder="e.g. 450" />
      </div>

      {/* Acquisition */}
      <div className="grid grid-cols-2 gap-4">
        <Select label="How Acquired" value={form.acquisitionMethod} onChange={e => set('acquisitionMethod', e.target.value)} required
          options={ACQUISITION_METHODS} />
        <Input label="Acquisition Date" type="date" value={form.acquisitionDate} onChange={e => set('acquisitionDate', e.target.value)} />
      </div>

      <Input label="Acquisition Source" value={form.acquisitionSource} onChange={e => set('acquisitionSource', e.target.value)} placeholder="e.g. Smith Ranch, Born on farm" />

      {/* IRS Schedule F classification */}
      <div className="space-y-2">
        <Select
          label="IRS Schedule F Classification"
          value={form.classification}
          onChange={e => set('classification', e.target.value)}
          required
          options={ANIMAL_CLASSIFICATIONS.map(c => ({ value: c.value, label: c.label }))}
        />
        {classificationHint && (
          <p className={`text-xs px-3 py-2 rounded-lg ${
            form.classification === 'review_needed'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : form.classification === 'breeding_dairy' || form.classification === 'draft_work'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {classificationHint.description}
          </p>
        )}
      </div>

      <Input label="Intended Use (optional)" value={form.intendedUse} onChange={e => set('intendedUse', e.target.value)} placeholder="e.g. Market steer, Show heifer, Replacement heifer" />

      {/* Purchase details – only for purchased resale animals */}
      {showPurchaseFields && (
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">Purchase Cost Basis</p>
            <p className="text-xs text-amber-700 mt-0.5">
              This cost is <strong>deferred</strong> and will appear on Schedule F Line 1b only in the year this animal is sold.
              Do not include feed, vet, or care costs here — those are deducted separately in the year paid.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Purchase Date" type="date" value={purchaseForm.purchaseDate} onChange={e => setP('purchaseDate', e.target.value)} required />
            <Input label="Purchase Price ($)" type="number" step="0.01" min="0" value={purchaseForm.purchasePrice} onChange={e => setP('purchasePrice', e.target.value)} required placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Trucking / Delivery Cost ($)" type="number" step="0.01" min="0" value={purchaseForm.truckingCost} onChange={e => setP('truckingCost', e.target.value)} placeholder="0.00" />
            <Input label="Other Acquisition Costs ($)" type="number" step="0.01" min="0" value={purchaseForm.otherCosts} onChange={e => setP('otherCosts', e.target.value)} placeholder="0.00" />
          </div>
          {(purchaseForm.purchasePrice || purchaseForm.truckingCost || purchaseForm.otherCosts) && (
            <p className="text-xs font-semibold text-amber-800">
              Cost basis: ${(
                (parseFloat(purchaseForm.purchasePrice) || 0) +
                (parseFloat(purchaseForm.truckingCost) || 0) +
                (parseFloat(purchaseForm.otherCosts) || 0)
              ).toFixed(2)} (deferred until sale)
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Seller Name" value={purchaseForm.sellerName} onChange={e => setP('sellerName', e.target.value)} placeholder="e.g. Smith Ranch" />
            <Input label="Reference # (check, invoice)" value={purchaseForm.referenceNumber} onChange={e => setP('referenceNumber', e.target.value)} placeholder="e.g. Check #1234" />
          </div>
          <Textarea label="Purchase Notes" value={purchaseForm.notes} onChange={e => setP('notes', e.target.value)} placeholder="Bill of sale details, condition notes, etc." />
        </div>
      )}

      {/* Location / physical */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Location / Pen" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. North Pasture" />
        <Input label="Color / Markings" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Black and white" />
      </div>

      <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>{editId ? 'Update Animal' : 'Add Animal'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
