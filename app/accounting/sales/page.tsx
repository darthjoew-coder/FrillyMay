'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import SaleTable from '@/components/accounting/SaleTable'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { ISale } from '@/types'
import { SALE_PRODUCT_TYPES } from '@/lib/constants'

const currentYear = new Date().getFullYear()

export default function SalesPage() {
  const [sales, setSales] = useState<ISale[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [year, setYear] = useState(String(currentYear))
  const [productType, setProductType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (year) params.set('year', year)
    if (productType) params.set('productType', productType)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const res = await fetch(`/api/accounting/sales?${params}`)
    const data = await res.json()
    setSales(data.data || [])
    setLoading(false)
  }, [year, productType, dateFrom, dateTo])

  useEffect(() => { fetchSales() }, [fetchSales])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/accounting/sales/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchSales()
  }

  const yearOptions = [-2, -1, 0, 1, 2].map(o => ({
    value: String(currentYear + o),
    label: String(currentYear + o),
  }))

  return (
    <>
      <TopBar
        title="Sales"
        subtitle={`${sales.length} sale${sales.length !== 1 ? 's' : ''}`}
        actions={<Link href="/accounting/sales/new"><Button>+ Record Sale</Button></Link>}
      />
      <PageWrapper>
        <div className="flex gap-3 mb-6 flex-wrap items-end">
          <div className="w-28">
            <Select value={year} onChange={e => setYear(e.target.value)} options={yearOptions} label="Year" />
          </div>
          <div className="w-40">
            <Select value={productType} onChange={e => setProductType(e.target.value)} options={SALE_PRODUCT_TYPES} placeholder="All types" label="Product Type" />
          </div>
          <div className="w-36">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} label="From" />
          </div>
          <div className="w-36">
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} label="To" />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : sales.length === 0 ? (
          <EmptyState
            title="No sales found"
            description="Record your first sale to get started."
            actionLabel="Record Sale"
            actionHref="/accounting/sales/new"
            icon="💵"
          />
        ) : (
          <SaleTable sales={sales} onDelete={(id, label) => setDeleteTarget({ id, label })} />
        )}
      </PageWrapper>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Sale"
        confirmLabel="Delete Sale"
        confirmVariant="danger"
        loading={deleting}
        description={`This will permanently delete "${deleteTarget?.label}". This cannot be undone.`}
      />
    </>
  )
}
