'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import AnimalTagSearch from '@/components/ui/AnimalTagSearch'
import { IFeedingRecord } from '@/types'
import { FEED_TYPES, FEEDING_TIME_OPTIONS, WATER_ACCESS_OPTIONS, UNIT_OPTIONS, SCHEDULE_FREQUENCIES } from '@/lib/constants'

interface FeedingFormProps {
  initial?: Partial<IFeedingRecord>
  editId?: string
}

export default function FeedingForm({ initial, editId }: FeedingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTemplate, setIsTemplate] = useState(initial?.isScheduleTemplate || false)
  const [form, setForm] = useState({
    animalId: initial?.animalId || '',
    groupName: initial?.groupName || '',
    date: initial?.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
    feedType: initial?.feedType || '',
    feedBrand: initial?.feedBrand || '',
    quantity: initial?.quantity?.toString() || '',
    unit: initial?.unit || '',
    feedingTime: initial?.feedingTime || '',
    waterAccess: initial?.waterAccess || '',
    waterNotes: initial?.waterNotes || '',
    scheduleFrequency: initial?.scheduleFrequency || '',
    cost: initial?.cost?.toString() || '',
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
        isScheduleTemplate: isTemplate,
        quantity: form.quantity ? parseFloat(form.quantity) : undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        animalId: form.animalId || undefined,
        groupName: form.groupName || undefined,
      }
      const url = editId ? `/api/feeding/${editId}` : '/api/feeding'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.push('/feeding')
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

      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
        <input type="checkbox" id="isTemplate" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)} className="w-4 h-4 text-green-600" />
        <label htmlFor="isTemplate" className="text-sm font-medium text-amber-800">Save as Schedule Template (not a log entry)</label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnimalTagSearch
          label="Animal"
          value={form.animalId}
          onChange={id => set('animalId', id)}
          initialTag={initial?.animal?.tagId}
          optional
          placeholder="Leave blank for group feeding"
        />
        <Input label="Group / Pen Name (optional)" value={form.groupName} onChange={e => set('groupName', e.target.value)} placeholder="e.g. East Pasture" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Feed Type" value={form.feedType} onChange={e => set('feedType', e.target.value)} required
          options={FEED_TYPES.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
          placeholder="Select feed type" />
        <Input label="Feed Brand" value={form.feedBrand} onChange={e => set('feedBrand', e.target.value)} placeholder="e.g. Purina" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Quantity" type="number" min="0" step="0.1" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="e.g. 5" />
        <Select label="Unit" value={form.unit} onChange={e => set('unit', e.target.value)}
          options={UNIT_OPTIONS.map(u => ({ value: u, label: u }))}
          placeholder="Select unit" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label="Feeding Time" value={form.feedingTime} onChange={e => set('feedingTime', e.target.value)}
          options={FEEDING_TIME_OPTIONS.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
          placeholder="Select time" />
        <Select label="Water Access" value={form.waterAccess} onChange={e => set('waterAccess', e.target.value)}
          options={WATER_ACCESS_OPTIONS.map(o => ({ value: o, label: o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
          placeholder="Select water status" />
      </div>

      {isTemplate ? (
        <Select label="Schedule Frequency" value={form.scheduleFrequency} onChange={e => set('scheduleFrequency', e.target.value)}
          options={SCHEDULE_FREQUENCIES.map(f => ({ value: f, label: f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
          placeholder="Select frequency" />
      ) : (
        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Cost ($)" type="number" min="0" step="0.01" value={form.cost} onChange={e => set('cost', e.target.value)} />
        <Input label="Water Notes" value={form.waterNotes} onChange={e => set('waterNotes', e.target.value)} placeholder="e.g. Trough cleaned" />
      </div>

      <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>{editId ? 'Update' : isTemplate ? 'Save Schedule' : 'Log Feeding'}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
