'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import FeedingTable from '@/components/feeding/FeedingTable'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { IFeedingRecord } from '@/types'

function FeedingContent() {
  const searchParams = useSearchParams()
  const [records, setRecords] = useState<IFeedingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'log' | 'schedules'>('log')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const animalId = searchParams.get('animalId') || ''

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (animalId) params.set('animalId', animalId)
    params.set('isScheduleTemplate', tab === 'schedules' ? 'true' : 'false')
    const res = await fetch(`/api/feeding?${params}`)
    const data = await res.json()
    setRecords(data.data || [])
    setLoading(false)
  }, [tab, animalId])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/feeding/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    fetchRecords()
  }

  return (
    <>
      <TopBar title="Feeding & Nutrition" subtitle="Feed logs, schedules, and water access"
        actions={<Link href="/feeding/new"><Button>+ Add Feeding Record</Button></Link>} />
      <PageWrapper>
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {(['log', 'schedules'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
              {t === 'log' ? 'Feed Log' : 'Schedule Templates'}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner /> : records.length === 0 ? (
          <EmptyState title={tab === 'schedules' ? 'No schedule templates' : 'No feeding records'}
            description={tab === 'schedules' ? 'Create feeding schedule templates for your animals.' : 'Start logging feeding events.'}
            actionLabel="Add Feeding Record" actionHref="/feeding/new" icon="🌾" />
        ) : (
          <FeedingTable records={records} onDelete={id => setDeleteId(id)} />
        )}
      </PageWrapper>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Feeding Record" confirmLabel="Delete" confirmVariant="danger" loading={deleting}
        description="This will permanently delete this feeding record." />
    </>
  )
}

export default function FeedingPage() {
  return <Suspense fallback={<LoadingSpinner />}><FeedingContent /></Suspense>
}
