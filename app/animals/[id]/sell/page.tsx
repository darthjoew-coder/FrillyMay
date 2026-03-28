'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { IAnimal, IAnimalPurchase } from '@/types'
import { ANIMAL_SALE_TYPES, ANIMAL_CLASSIFICATIONS } from '@/lib/constants'

export default function SellAnimalPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [animal, setAnimal] = useState<IAnimal | null>(null)
  const [purchase, setPurchase] = useState<IAnimalPurchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    saleAmount: '',
    buyerName: '',
    saleType: 'private',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    async function load() {
      const [animalRes, purchaseRes] = await Promise.all([
        fetch(`/api/animals/${id}`),
        fetch(`/api/animals/${id}/purchase`),
      ])
      const animalData = await animalRes.json()
      const purchaseData = await purchaseRes.json()
      setAnimal(animalData.data)
      setPurchase(purchaseData.data)
      setLoading(false)
    }
    load()
  }, [id])

  const classificationInfo = ANIMAL_CLASSIFICATIONS.find(c => c.value === animal?.classification)

  const isResale = animal?.classification === 'resale_inventory'
  const isRaised = animal?.classification === 'raised_for_sale'
  const isForm4797 = animal?.classification === 'breeding_dairy' || animal?.classification === 'draft_work'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/animals/${id}/sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleDate: form.saleDate,
          saleAmount: parseFloat(form.saleAmount),
          buyerName: form.buyerName || undefined,
          saleType: form.saleType || undefined,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to record sale')
      router.push(`/animals/${id}`)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><TopBar title="Record Sale" /><PageWrapper><p className="text-gray-500">Loading...</p></PageWrapper></>

  if (!animal) return <><TopBar title="Record Sale" /><PageWrapper><p className="text-gray-500">Animal not found.</p></PageWrapper></>

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <>
      <TopBar
        title={`Record Sale — ${animal.name ? `${animal.tagId} ${animal.name}` : animal.tagId}`}
        subtitle={`${animal.species} · ${animal.breed || 'Unknown breed'}`}
      />
      <PageWrapper>
        <div className="max-w-xl space-y-6">
          {/* Schedule F classification reminder */}
          <div className={`rounded-xl px-4 py-3 text-sm border ${
            isForm4797
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : animal?.classification === 'review_needed'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <p className="font-semibold mb-0.5">
              {isResale && 'Schedule F Line 1 — Purchased Livestock Sold for Resale'}
              {isRaised && 'Schedule F Line 2 — Raised Livestock Sold'}
              {isForm4797 && 'Excluded from Schedule F — Report on Form 4797'}
              {animal?.classification === 'review_needed' && 'Classification Needed — Will Not Appear on Schedule F'}
              {animal?.classification === 'other' && 'Classification: Other — Will Not Appear on Schedule F lines'}
            </p>
            <p className="text-xs opacity-80">{classificationInfo?.description}</p>
            {isResale && purchase && (
              <p className="text-xs font-semibold mt-1">
                Deferred cost basis: {fmt(purchase.costBasis)} — will be reported on Line 1b
              </p>
            )}
            {isResale && !purchase && (
              <p className="text-xs font-semibold mt-1 text-amber-700">
                No purchase record found. Cost basis will be $0.00 on Line 1b.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <Input label="Sale Date" type="date" value={form.saleDate} onChange={e => set('saleDate', e.target.value)} required />
              <Input label="Sale Amount ($)" type="number" step="0.01" min="0" value={form.saleAmount} onChange={e => set('saleAmount', e.target.value)} required placeholder="0.00" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Buyer Name (optional)" value={form.buyerName} onChange={e => set('buyerName', e.target.value)} placeholder="e.g. Jones Feedlot" />
              <Select label="Sale Type" value={form.saleType} onChange={e => set('saleType', e.target.value)} options={ANIMAL_SALE_TYPES} />
            </div>

            <Textarea label="Notes (optional)" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Auction receipt #, weight, any other details..." />

            <div className="flex gap-3">
              <Button type="submit" loading={saving}>Record Sale</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </div>
      </PageWrapper>
    </>
  )
}
