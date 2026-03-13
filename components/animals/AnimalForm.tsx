'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { IAnimal } from '@/types'
import { SPECIES_OPTIONS, ANIMAL_STATUSES, SEX_OPTIONS } from '@/lib/constants'

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
    currentWeight: initial?.currentWeight?.toString() || '',
    status: initial?.status || 'active',
    location: initial?.location || '',
    color: initial?.color || '',
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
        currentWeight: form.currentWeight ? parseFloat(form.currentWeight) : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        acquisitionDate: form.acquisitionDate || undefined,
      }
      const url = editId ? `/api/animals/${editId}` : '/api/animals'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push(`/animals/${data.data._id}`)
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

      <div className="grid grid-cols-2 gap-4">
        <Input label="Acquisition Date" type="date" value={form.acquisitionDate} onChange={e => set('acquisitionDate', e.target.value)} />
        <Input label="Acquisition Source" value={form.acquisitionSource} onChange={e => set('acquisitionSource', e.target.value)} placeholder="e.g. Born on farm" />
      </div>

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
