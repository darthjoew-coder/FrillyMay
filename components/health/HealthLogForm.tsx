'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import AnimalTagSearch from '@/components/ui/AnimalTagSearch'
import { IHealthRecord } from '@/types'
import { HEALTH_TYPES } from '@/lib/constants'

interface HealthLogFormProps {
  initial?: Partial<IHealthRecord>
  editId?: string
  preselectedAnimalId?: string
}

export default function HealthLogForm({ initial, editId, preselectedAnimalId }: HealthLogFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    animalId: initial?.animalId || preselectedAnimalId || '',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    type: initial?.type || '',
    title: initial?.title || '',
    description: initial?.description || '',
    medication: initial?.medication || '',
    dosage: initial?.dosage || '',
    administeredBy: initial?.administeredBy || '',
    cost: initial?.cost?.toString() || '',
    nextDueDate: initial?.nextDueDate ? initial.nextDueDate.split('T')[0] : '',
    isScheduled: initial?.isScheduled ? 'true' : 'false',
    scheduledDate: initial?.scheduledDate ? initial.scheduledDate.split('T')[0] : '',
    weight: initial?.weight?.toString() || '',
    temperature: initial?.temperature?.toString() || '',
    notes: initial?.notes || '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const isScheduled = form.isScheduled === 'true'
      const payload = {
        ...form,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        temperature: form.temperature ? parseFloat(form.temperature) : undefined,
        nextDueDate: form.nextDueDate || undefined,
        isScheduled,
        scheduledDate: isScheduled && form.scheduledDate ? form.scheduledDate : undefined,
        date: isScheduled ? (form.scheduledDate || form.date) : form.date,
      }
      const url = editId ? `/api/health/${editId}` : '/api/health'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push('/health')
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
          label="Animal"
          value={form.animalId}
          onChange={id => set('animalId', id)}
          initialTag={initial?.animal?.tagId}
          required
        />
        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Type" value={form.type} onChange={e => set('type', e.target.value)} required
          options={HEALTH_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
          placeholder="Select type" />
        <Input label="Title" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Annual Rabies Vaccine" />
      </div>

      <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Details about the treatment..." />

      <div className="grid grid-cols-2 gap-4">
        <Input label="Medication / Vaccine Name" value={form.medication} onChange={e => set('medication', e.target.value)} placeholder="e.g. Bovishield Gold" />
        <Input label="Dosage" value={form.dosage} onChange={e => set('dosage', e.target.value)} placeholder="e.g. 5ml" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Administered By" value={form.administeredBy} onChange={e => set('administeredBy', e.target.value)} placeholder="e.g. Dr. Smith / Self" />
        <Input label="Cost ($)" type="number" min="0" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="0.00" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Weight at Visit (kg)" type="number" min="0" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)} />
        <Input label="Temperature (°F)" type="number" min="90" max="110" step="0.1" value={form.temperature} onChange={e => set('temperature', e.target.value)} />
      </div>

      <Input label="Next Due Date" type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} hint="Set a reminder for recurring treatments" />

      {/* Scheduled future event */}
      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isScheduled"
            checked={form.isScheduled === 'true'}
            onChange={e => set('isScheduled', e.target.checked ? 'true' : 'false')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <label htmlFor="isScheduled" className="text-sm font-medium text-blue-900">
            Schedule as a future event
          </label>
        </div>
        {form.isScheduled === 'true' && (
          <div className="space-y-2">
            <p className="text-xs text-blue-700">An alert will appear on the site 7 days before the scheduled date.</p>
            <Input
              label="Scheduled Date"
              type="date"
              value={form.scheduledDate}
              onChange={e => set('scheduledDate', e.target.value)}
              required={form.isScheduled === 'true'}
            />
          </div>
        )}
      </div>

      <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>{editId ? 'Update Record' : 'Log Health Event'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
