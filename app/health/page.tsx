'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import HealthLogTable from '@/components/health/HealthLogTable'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { IHealthRecord } from '@/types'
import { HEALTH_TYPES } from '@/lib/constants'

function HealthContent() {
  const searchParams = useSearchParams()
  const [records, setRecords] = useState<IHealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [upcoming, setUpcoming] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const animalId = searchParams.get('animalId') || ''

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (animalId) params.set('animalId', animalId)
    if (type) params.set('type', type)
    if (upcoming) params.set('upcoming', 'true')
    const res = await fetch(`/api/health?${params}`)
    const data = await res.json()
    setRecords(data.data || [])
    setLoading(false)
  }, [animalId, type, upcoming])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/health/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    fetchRecords()
  }

  return (
    <>
      <TopBar title="Health & Treatments" subtitle="Health events, vaccinations, and treatments"
        actions={<Link href={`/health/new${animalId ? `?animalId=${animalId}` : ''}`}><Button>+ Log Health Event</Button></Link>} />
      <PageWrapper>
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <div className="w-48">
            <Select value={type} onChange={e => setType(e.target.value)}
              options={HEALTH_TYPES.map(t => ({ value: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))}
              placeholder="All types" />
          </div>
          <button
            onClick={() => setUpcoming(u => !u)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${upcoming ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-300 text-gray-600'}`}
          >
            Upcoming Due Dates
          </button>
          {animalId && <span className="text-sm text-gray-500 bg-green-50 border border-green-200 px-3 py-1.5 rounded-md">Filtered by animal</span>}
        </div>
        {loading ? <LoadingSpinner /> : records.length === 0 ? (
          <EmptyState title="No health records" description="Start logging health events, vaccinations, and treatments." actionLabel="Log Health Event" actionHref="/health/new" icon="🩺" />
        ) : (
          <HealthLogTable records={records} onDelete={id => setDeleteId(id)} />
        )}
      </PageWrapper>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Health Record" confirmLabel="Delete" confirmVariant="danger" loading={deleting}
        description="This will permanently delete this health record." />
    </>
  )
}

export default function HealthPage() {
  return <Suspense fallback={<LoadingSpinner />}><HealthContent /></Suspense>
}
