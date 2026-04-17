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
import { IOwnerEquity } from '@/types'

const currentYear = new Date().getFullYear()
const yearOptions = [
  { value: '', label: 'All Years' },
  ...[-3, -2, -1, 0, 1, 2].map(o => ({ value: String(currentYear + o), label: String(currentYear + o) })),
]

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export default function EquityPage() {
  const [records, setRecords] = useState<IOwnerEquity[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(currentYear))
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (year) params.set('year', year)
    if (typeFilter) params.set('type', typeFilter)
    const res = await fetch(`/api/accounting/equity?${params}`)
    const data = await res.json()
    setRecords(data.data || [])
    setLoading(false)
  }, [year, typeFilter])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/accounting/equity/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchRecords()
  }

  const contributions = records.filter(r => r.type === 'contribution').reduce((s, r) => s + r.amount, 0)
  const draws = records.filter(r => r.type === 'draw').reduce((s, r) => s + r.amount, 0)

  return (
    <>
      <TopBar
        title="Owner Equity"
        subtitle="Owner Capital · Contributions & Draws"
        actions={<Link href="/accounting/equity/new"><Button>+ Record Transaction</Button></Link>}
      />
      <PageWrapper>
        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Contributions {year || '(all years)'}</p>
            <p className="text-xl font-bold text-green-700">{fmt(contributions)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Draws {year || '(all years)'}</p>
            <p className="text-xl font-bold text-red-700">{fmt(draws)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Net Change {year || '(all years)'}</p>
            <p className={`text-xl font-bold ${contributions - draws >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(contributions - draws)}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-end">
          <div className="w-36">
            <Select value={year} onChange={e => setYear(e.target.value)} options={yearOptions} label="Year" />
          </div>
          <div className="w-48">
            <Select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={[
                { value: 'contribution', label: 'Contributions' },
                { value: 'draw', label: 'Draws' },
              ]}
              placeholder="All types"
              label="Type"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
          <strong>Tax note:</strong> Owner contributions and draws do not appear on Schedule F.
          They are not income or deductible expenses — they affect only your equity basis in the business.
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <EmptyState
            title="No equity transactions"
            description="Record owner contributions or draws to track your equity in the farm."
            actionLabel="Record Transaction"
            actionHref="/accounting/equity/new"
            icon="🏦"
          />
        ) : (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.type === 'contribution' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.type === 'contribution' ? 'Contribution' : 'Draw'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{r.paymentMethod?.replace('_', ' ') || '—'}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${r.type === 'contribution' ? 'text-green-700' : 'text-red-700'}`}>
                      {r.type === 'draw' ? '-' : ''}{fmt(r.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/accounting/equity/${r._id}/edit`}>
                          <Button variant="secondary">Edit</Button>
                        </Link>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget({ id: r._id, label: `${r.type} of ${fmt(r.amount)} on ${fmtDate(r.date)}` })}
                        >
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
        title="Delete Transaction"
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
        description={`Permanently delete "${deleteTarget?.label}"? This cannot be undone.`}
      />
    </>
  )
}
