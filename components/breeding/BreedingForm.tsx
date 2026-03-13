'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import AnimalTagSearch from '@/components/ui/AnimalTagSearch'
import { IBreedingEvent } from '@/types'
import { SPECIES_OPTIONS, BREEDING_METHODS, BREEDING_STATUSES } from '@/lib/constants'

interface BreedingFormProps {
  initial?: Partial<IBreedingEvent>
  editId?: string
}

export default function BreedingForm({ initial, editId }: BreedingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    damId: initial?.damId || '',
    sireId: initial?.sireId || '',
    sireExternal: initial?.sireExternal || '',
    breedingDate: initial?.breedingDate ? initial.breedingDate.split('T')[0] : new Date().toISOString().split('T')[0],
    method: initial?.method || 'natural',
    species: initial?.species || '',
    expectedDueDate: initial?.expectedDueDate ? initial.expectedDueDate.split('T')[0] : '',
    gestationDays: initial?.gestationDays?.toString() || '',
    status: initial?.status || 'pending',
    confirmationDate: initial?.confirmationDate ? initial.confirmationDate.split('T')[0] : '',
    confirmationMethod: initial?.confirmationMethod || '',
    actualDeliveryDate: initial?.actualDeliveryDate ? initial.actualDeliveryDate.split('T')[0] : '',
    offspringCount: initial?.offspringCount?.toString() || '',
    offspringNotes: initial?.offspringNotes || '',
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
        gestationDays: form.gestationDays ? parseInt(form.gestationDays) : undefined,
        offspringCount: form.offspringCount ? parseInt(form.offspringCount) : undefined,
        expectedDueDate: form.expectedDueDate || undefined,
        sireId: form.sireId || undefined,
        sireExternal: form.sireExternal || undefined,
        confirmationDate: form.confirmationDate || undefined,
        actualDeliveryDate: form.actualDeliveryDate || undefined,
      }
      const url = editId ? `/api/breeding/${editId}` : '/api/breeding'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push('/breeding')
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

      <div className="grid grid-cols-2 gap-4">
        <AnimalTagSearch
          label="Dam (Mother)"
          value={form.damId}
          onChange={id => set('damId', id)}
          initialTag={initial?.dam?.tagId}
          required
          placeholder="Type dam tag number..."
        />
        <AnimalTagSearch
          label="Sire (Father)"
          value={form.sireId}
          onChange={id => set('sireId', id)}
          initialTag={initial?.sire?.tagId}
          optional
          placeholder="Type sire tag number..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="External Sire (optional)" value={form.sireExternal} onChange={e => set('sireExternal', e.target.value)} placeholder="Name/ID if not registered" />
        <Select label="Species" value={form.species} onChange={e => set('species', e.target.value)} required
          options={SPECIES_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          placeholder="Select species" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Breeding Date" type="date" value={form.breedingDate} onChange={e => set('breedingDate', e.target.value)} required />
        <Select label="Method" value={form.method} onChange={e => set('method', e.target.value)}
          options={BREEDING_METHODS.map(m => ({ value: m, label: m.replace(/_/g, ' ').toUpperCase() }))} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Expected Due Date (auto-calculated if blank)" type="date" value={form.expectedDueDate} onChange={e => set('expectedDueDate', e.target.value)} />
        <Input label="Gestation Days Override" type="number" value={form.gestationDays} onChange={e => set('gestationDays', e.target.value)} placeholder="Leave blank for default" />
      </div>

      <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}
        options={BREEDING_STATUSES.map(s => ({ value: s, label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))} />

      {(form.status === 'confirmed_pregnant' || form.status === 'delivered') && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Confirmation Date" type="date" value={form.confirmationDate} onChange={e => set('confirmationDate', e.target.value)} />
          <Input label="Confirmation Method" value={form.confirmationMethod} onChange={e => set('confirmationMethod', e.target.value)} placeholder="e.g. Ultrasound" />
        </div>
      )}

      {form.status === 'delivered' && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Actual Delivery Date" type="date" value={form.actualDeliveryDate} onChange={e => set('actualDeliveryDate', e.target.value)} />
          <Input label="Offspring Count" type="number" min="0" value={form.offspringCount} onChange={e => set('offspringCount', e.target.value)} />
        </div>
      )}

      <Textarea label="Offspring Notes" value={form.offspringNotes} onChange={e => set('offspringNotes', e.target.value)} placeholder="Birth weights, complications, etc." />
      <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>{editId ? 'Update Event' : 'Record Breeding Event'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
