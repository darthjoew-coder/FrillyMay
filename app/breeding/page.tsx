'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import BreedingTable from '@/components/breeding/BreedingTable'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { IBreedingEvent } from '@/types'

const STATUS_TABS = ['all', 'pending', 'confirmed_pregnant', 'delivered', 'lost', 'not_pregnant']

function BreedingContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<IBreedingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const damId = searchParams.get('damId') || ''

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (damId) params.set('damId', damId)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    const res = await fetch(`/api/breeding?${params}`)
    const data = await res.json()
    setEvents(data.data || [])
    setLoading(false)
  }, [statusFilter, damId])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/breeding/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    fetchEvents()
  }

  return (
    <>
      <TopBar title="Breeding & Reproduction" subtitle="Breeding events, pregnancy tracking, and offspring"
        actions={<Link href="/breeding/new"><Button>+ Add Breeding Event</Button></Link>} />
      <PageWrapper>
        <div className="flex gap-1 mb-6 flex-wrap">
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner /> : events.length === 0 ? (
          <EmptyState title="No breeding events" description="Record breeding events to track pregnancies and offspring."
            actionLabel="Add Breeding Event" actionHref="/breeding/new" icon="🐣" />
        ) : (
          <BreedingTable events={events} onDelete={id => setDeleteId(id)} />
        )}
      </PageWrapper>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Breeding Event" confirmLabel="Delete" confirmVariant="danger" loading={deleting}
        description="This will permanently delete this breeding event record." />
    </>
  )
}

export default function BreedingPage() {
  return <Suspense fallback={<LoadingSpinner />}><BreedingContent /></Suspense>
}
