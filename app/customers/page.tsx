'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CustomerTable from '@/components/customers/CustomerTable'
import { ICustomer } from '@/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<ICustomer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('true')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '50', isActive })
    if (search) params.set('search', search)
    const res = await fetch(`/api/customers?${params}`)
    const data = await res.json()
    setCustomers(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [search, isActive])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/customers/${deleteTarget.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    setDeleteTarget(null)
    if (data.data?.deactivated) {
      // refresh — they were deactivated not deleted
      fetchCustomers()
    } else {
      fetchCustomers()
    }
  }

  return (
    <>
      <TopBar
        title="Customers"
        subtitle={`${total} customer${total !== 1 ? 's' : ''}`}
        actions={
          <Link href="/customers/new">
            <Button size="sm">+ Add Customer</Button>
          </Link>
        }
      />
      <PageWrapper>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, business, email…"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 w-64"
          />
          <select
            value={isActive}
            onChange={e => setIsActive(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
            <option value="all">All customers</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : customers.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No customers yet"
            description={search ? 'No customers match your search.' : 'Add your first customer to get started.'}
            action={!search ? { label: 'Add Customer', href: '/customers/new' } : undefined}
          />
        ) : (
          <CustomerTable customers={customers} onDelete={(id, name) => setDeleteTarget({ id, name })} />
        )}
      </PageWrapper>

      <Modal
        isOpen={!!deleteTarget}
        title="Remove customer?"
        description={`"${deleteTarget?.name}" will be deactivated if they have sales, or permanently deleted if they have none.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        confirmLabel="Remove"
        confirmVariant="danger"
        loading={deleting}
      />
    </>
  )
}
