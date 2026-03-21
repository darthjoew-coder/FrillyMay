'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const STATUS_OPTIONS = [
  { value: 'processing', label: 'Processing' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

export default function ReceiptEditPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/accounting/receipts/${id}/meta`)
      .then(r => r.json())
      .then(d => {
        setStatus(d.data?.status || 'processing')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/accounting/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      router.back()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <TopBar title="Edit Receipt" />
      <PageWrapper>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-sm">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <Select
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <div className="flex gap-3">
              <Button type="submit" loading={saving}>Save</Button>
              <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        )}
      </PageWrapper>
    </>
  )
}
