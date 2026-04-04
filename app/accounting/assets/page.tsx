'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { IFarmAsset } from '@/types'
import { ASSET_CATEGORIES, ASSET_STATUSES } from '@/lib/constants'

function fmtCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function fmtDate(s: string) {
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return s }
}

const categoryLabel = (v: string) => ASSET_CATEGORIES.find(c => c.value === v)?.label || v

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  disposed: 'bg-gray-100 text-gray-600',
  fully_depreciated: 'bg-blue-100 text-blue-700',
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<IFarmAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    const res = await fetch(`/api/accounting/assets?${params}`)
    const data = await res.json()
    setAssets(data.data || [])
    setLoading(false)
  }, [statusFilter, categoryFilter])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/accounting/assets/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchAssets()
  }

  const totalBasis = assets.reduce((s, a) => s + a.costBasis, 0)

  return (
    <>
      <TopBar
        title="Capital Assets"
        subtitle={`${assets.length} asset${assets.length !== 1 ? 's' : ''} · ${fmtCurrency(totalBasis)} total cost basis`}
        actions={<Link href="/accounting/assets/new"><Button>+ Add Asset</Button></Link>}
      />
      <PageWrapper>
        <div className="flex gap-3 mb-6 flex-wrap items-end">
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={ASSET_STATUSES}
              placeholder="All statuses"
              label="Status"
            />
          </div>
          <div className="w-56">
            <Select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={ASSET_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              placeholder="All categories"
              label="Category"
            />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
          <strong>IRS Publication 225:</strong> Capital assets (useful life &gt; 1 year) must be depreciated
          over their recovery period. Use this register to track assets and record annual depreciation
          for Schedule F Line 14d / Form 4562.
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : assets.length === 0 ? (
          <EmptyState
            title="No capital assets"
            description="Add farm machinery, buildings, land improvements, or other capitalizable assets."
            actionLabel="Add Asset"
            actionHref="/accounting/assets/new"
            icon="🏗️"
          />
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Asset</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">In Service</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Cost Basis</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Life (yrs)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/accounting/assets/${a._id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {a.name}
                      </Link>
                      {a.vendor && <p className="text-xs text-gray-500 mt-0.5">{a.vendor}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{categoryLabel(a.assetCategory)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(a.placedInServiceDate)}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtCurrency(a.costBasis)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{a.usefulLifeYears}</td>
                    <td className="px-4 py-3 text-gray-600 uppercase text-xs">{a.depreciationMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/accounting/assets/${a._id}/edit`}>
                          <Button variant="secondary">Edit</Button>
                        </Link>
                        <Button variant="danger" onClick={() => setDeleteTarget({ id: a._id, name: a.name })}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageWrapper>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Asset"
        confirmLabel="Delete Asset"
        confirmVariant="danger"
        loading={deleting}
        description={`This will permanently delete "${deleteTarget?.name}" and all of its depreciation records. This cannot be undone.`}
      />
    </>
  )
}
