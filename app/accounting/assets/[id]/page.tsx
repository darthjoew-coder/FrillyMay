import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import { connectDB } from '@/lib/db'
import { FarmAsset } from '@/models/FarmAsset'
import { AssetDepreciation } from '@/models/AssetDepreciation'
import { ASSET_CATEGORIES, DEPRECIATION_METHODS } from '@/lib/constants'
import AssetDepreciationForm from '@/components/accounting/AssetDepreciationForm'
import DepreciationDeleteButton from '@/components/accounting/DepreciationDeleteButton'

function fmtCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmtDate(d: unknown) {
  if (!d) return '—'
  try { return (d as Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return String(d) }
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const [rawAsset, rawRecords] = await Promise.all([
    FarmAsset.findById(id).lean(),
    AssetDepreciation.find({ assetId: id }).sort({ taxYear: 1 }).lean(),
  ])

  if (!rawAsset) notFound()

  const a = rawAsset as unknown as Record<string, unknown>
  const records = rawRecords as unknown as Array<Record<string, unknown>>

  const totalDepreciated = records.reduce((s, r) => s + (r.depreciationAmount as number), 0)
  const remainingBasis = (a.costBasis as number) - totalDepreciated

  const categoryLabel = ASSET_CATEGORIES.find(c => c.value === a.assetCategory)?.label || String(a.assetCategory)
  const methodLabel = DEPRECIATION_METHODS.find(m => m.value === a.depreciationMethod)?.label || String(a.depreciationMethod)

  return (
    <>
      <TopBar
        title={String(a.name)}
        subtitle={categoryLabel}
        actions={
          <Link href={`/accounting/assets/${id}/edit`} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Edit Asset
          </Link>
        }
      />
      <PageWrapper>
        <div className="space-y-8">
          {/* Asset details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Cost Basis</p>
              <p className="text-xl font-bold text-gray-900">{fmtCurrency(a.costBasis as number)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total Depreciated</p>
              <p className="text-xl font-bold text-blue-700">{fmtCurrency(totalDepreciated)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Remaining Basis</p>
              <p className="text-xl font-bold text-green-700">{fmtCurrency(Math.max(0, remainingBasis))}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Recovery Period</p>
              <p className="text-xl font-bold text-gray-900">{a.usefulLifeYears as number} yrs</p>
            </div>
          </div>

          {/* Asset metadata */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Placed in Service</p>
              <p className="font-medium text-gray-900">{fmtDate(a.placedInServiceDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Depreciation Method</p>
              <p className="font-medium text-gray-900">{methodLabel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Status</p>
              <p className="font-medium text-gray-900 capitalize">{String(a.status).replace('_', ' ')}</p>
            </div>
            {(a.section179Amount as number) > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">§179 Expensed</p>
                <p className="font-medium text-gray-900">{fmtCurrency(a.section179Amount as number)}</p>
              </div>
            )}
            {(a.bonusDepreciationPct as number) > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Bonus Depreciation</p>
                <p className="font-medium text-gray-900">{a.bonusDepreciationPct as number}%</p>
              </div>
            )}
            {(a.vendor as string | undefined) && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Vendor</p>
                <p className="font-medium text-gray-900">{String(a.vendor)}</p>
              </div>
            )}
            {(a.serialNumber as string | undefined) && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Serial / VIN</p>
                <p className="font-medium text-gray-900">{String(a.serialNumber)}</p>
              </div>
            )}
            {(a.location as string | undefined) && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Location</p>
                <p className="font-medium text-gray-900">{String(a.location)}</p>
              </div>
            )}
          </div>

          {/* Depreciation schedule */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">Depreciation Schedule (Schedule F Line 14d)</h2>
            {records.length > 0 ? (
              <div className="rounded-xl border border-gray-200 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tax Year</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Method</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Basis at Start</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Deduction</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Accumulated</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                      <tr key={String(r._id)} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.taxYear as number}</td>
                        <td className="px-4 py-3 text-gray-600 uppercase text-xs">{String(r.method)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmtCurrency(r.basisAtStartOfYear as number)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmtCurrency(r.depreciationAmount as number)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmtCurrency(r.accumulatedDepreciation as number)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.notes ? String(r.notes) : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <DepreciationDeleteButton assetId={id} taxYear={r.taxYear as number} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">No depreciation records yet. Add the first year below.</p>
            )}

            <AssetDepreciationForm
              assetId={id}
              costBasis={a.costBasis as number}
              method={String(a.depreciationMethod)}
              existingYears={records.map(r => r.taxYear as number)}
            />
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
