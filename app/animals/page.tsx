'use client'
import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import AnimalTable from '@/components/animals/AnimalTable'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'
import { IAnimal } from '@/types'
import { SPECIES_OPTIONS } from '@/lib/constants'

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<IAnimal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState('')
  const [status, setStatus] = useState('active')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAnimals = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (species) params.set('species', species)
    if (status) params.set('status', status)
    const res = await fetch(`/api/animals?${params}`)
    const data = await res.json()
    setAnimals(data.data || [])
    setLoading(false)
  }, [search, species, status])

  useEffect(() => { fetchAnimals() }, [fetchAnimals])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/animals/${deleteTarget.id}?cascade=true`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchAnimals()
  }

  return (
    <>
      <TopBar
        title="Animal Registry"
        subtitle={`${animals.length} animal${animals.length !== 1 ? 's' : ''}`}
        actions={<Link href="/animals/new"><Button>+ Add Animal</Button></Link>}
      />
      <PageWrapper>
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="w-56">
            <Input placeholder="Search tag or name..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-40">
            <Select value={species} onChange={e => setSpecies(e.target.value)}
              options={SPECIES_OPTIONS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
              placeholder="All species" />
          </div>
          <div className="w-36">
            <Select value={status} onChange={e => setStatus(e.target.value)}
              options={[{ value: 'active', label: 'Active' }, { value: 'sold', label: 'Sold' }, { value: 'deceased', label: 'Deceased' }]}
              placeholder="All statuses" />
          </div>
        </div>

        {loading ? <LoadingSpinner /> : animals.length === 0 ? (
          <EmptyState title="No animals found" description="Add your first animal to get started." actionLabel="Add Animal" actionHref="/animals/new" icon="🐄" />
        ) : (
          <AnimalTable animals={animals} onDelete={(id, name) => setDeleteTarget({ id, name })} />
        )}
      </PageWrapper>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Animal" confirmLabel="Delete Animal & Records" confirmVariant="danger" loading={deleting}
        description={`This will permanently delete "${deleteTarget?.name}" and ALL associated health, feeding, and breeding records. This cannot be undone.`} />
    </>
  )
}
