'use client'
import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { IAccountingReport } from '@/types'

const currentYear = new Date().getFullYear()
const yearOptions = [-3, -2, -1, 0, 1, 2, 3].map(o => ({
  value: String(currentYear + o),
  label: String(currentYear + o),
}))

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default function ReportsPage() {
  const [year, setYear] = useState(currentYear)
  const [report, setReport] = useState<IAccountingReport | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/accounting/reports?year=${year}`)
    const data = await res.json()
    setReport(data.data || null)
    setLoading(false)
  }, [year])

  useEffect(() => { fetchReport() }, [fetchReport])

  function exportCSV() {
    if (!report) return
    const rows: string[] = []
    rows.push(`Schedule F Tax Report - ${report.year}`)
    rows.push('')

    rows.push('=== PART I — FARM INCOME ===')
    rows.push('')
    rows.push('--- Schedule F Lines 1 & 2: Livestock Sales ---')
    rows.push('Line,Description,Amount')
    rows.push(`Line 1a,Gross sales of purchased livestock (resale),${report.livestock.line1a}`)
    rows.push(`Line 1b,Cost basis of purchased livestock sold,${report.livestock.line1b}`)
    rows.push(`Line 1 Net,Purchased livestock net (1a - 1b),${report.livestock.line1Net}`)
    rows.push(`Line 2,Raised livestock sold (full amount),${report.livestock.line2}`)
    if (report.livestock.form4797Count > 0) {
      rows.push(`Form 4797,Breeding/dairy/draft animals sold (${report.livestock.form4797Count} animals - EXCLUDED from Schedule F),${report.livestock.form4797Total}`)
    }
    rows.push('')
    rows.push('--- Other Farm Income ---')
    rows.push('Product Type,Amount,Count')
    for (const item of report.income.byProductType) {
      rows.push(`${item.productType},${item.total},${item.count}`)
    }
    rows.push(`Total Income,,${report.income.totalAmount}`)
    rows.push('')
    rows.push('=== PART II — FARM EXPENSES ===')
    rows.push('Line,Description,Amount')
    for (const item of report.expenses.byScheduleF) {
      rows.push(`${item.bucket},,${item.total}`)
    }
    rows.push(`Total Expenses,,${report.expenses.totalAmount}`)
    rows.push('')
    rows.push('=== FORM 4562 / SCHEDULE F LINE 14d — DEPRECIATION ===')
    rows.push(`Total Depreciation Deduction,,${report.depreciation?.totalAmount || 0}`)
    rows.push(`Assets with records,,${report.depreciation?.assetCount || 0}`)
    rows.push('')
    rows.push('=== EXPENSE BREAKDOWN BY CATEGORY ===')
    rows.push('Category,Schedule F Bucket,Amount,Count')
    for (const item of report.expenses.byCategory) {
      rows.push(`${item.name},${item.scheduleFBucket},${item.total},${item.count}`)
    }
    rows.push('')
    rows.push(`Net Farm Income,,${report.netIncome}`)

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schedule-f-${report.year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const net = report?.netIncome ?? 0
  const ls = report?.livestock

  return (
    <>
      <TopBar
        title="Tax Reports"
        subtitle="Schedule F Farm Income & Expense Summary"
        actions={
          <div className="flex items-center gap-3">
            <div className="w-32">
              <Select
                value={String(year)}
                onChange={e => setYear(Number(e.target.value))}
                options={yearOptions}
              />
            </div>
            <Button variant="secondary" onClick={exportCSV} disabled={!report || loading}>
              Export CSV
            </Button>
          </div>
        }
      />
      <PageWrapper>
        {loading ? (
          <LoadingSpinner />
        ) : !report ? (
          <p className="text-gray-500">No data found for {year}.</p>
        ) : (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-700">{fmt(report.income.totalAmount)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">{fmt(report.expenses.totalAmount)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Net Farm Income</p>
                <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(net)}</p>
              </div>
            </div>

            {/* Schedule F Lines 1 & 2 — Livestock Sales */}
            {ls && (ls.line1a > 0 || ls.line2 > 0 || ls.form4797Count > 0 || ls.reviewNeededCount > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Schedule F — Livestock Sales (Part I, Lines 1 & 2)</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Individual animal sales recorded via the Animal module</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {/* Line 1 — Purchased livestock */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Line 1 — Purchased Livestock for Resale</p>
                        <p className="text-xs text-gray-500 mt-0.5">Animals bought for resale and sold this year</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Line 1a — Gross Sales</p>
                        <p className="text-base font-bold text-green-700 mt-0.5">{fmt(ls.line1a)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Line 1b — Cost Basis</p>
                        <p className="text-base font-bold text-orange-700 mt-0.5">{fmt(ls.line1b)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Deferred from year of purchase</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Line 1 Net (1a − 1b)</p>
                        <p className={`text-base font-bold mt-0.5 ${ls.line1Net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(ls.line1Net)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Line 2 — Raised livestock */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Line 2 — Raised Livestock</p>
                        <p className="text-xs text-gray-500 mt-0.5">Animals born on farm and sold — full amount reported, no cost basis</p>
                      </div>
                      <p className="text-base font-bold text-green-700">{fmt(ls.line2)}</p>
                    </div>
                  </div>

                  {/* Form 4797 alert */}
                  {ls.form4797Count > 0 && (
                    <div className="px-6 py-4 bg-blue-50">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-800">Form 4797 — Breeding / Dairy / Draft Animals Sold ({ls.form4797Count})</p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            These are capital/business-use animals. They are <strong>excluded from Schedule F</strong> livestock lines.
                            Total sale amount of {fmt(ls.form4797Total)} must be reported on IRS Form 4797. Consult your tax advisor.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review needed alert */}
                  {ls.reviewNeededCount > 0 && (
                    <div className="px-6 py-4 bg-amber-50">
                      <p className="text-sm font-semibold text-amber-800">
                        {ls.reviewNeededCount} animal sale{ls.reviewNeededCount !== 1 ? 's' : ''} with unclassified animals — not included in any line
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Visit the Animals section and assign a Schedule F classification to include these in tax reporting.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Other income by product type */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Other Farm Income (Product Sales)</h2>
                <p className="text-xs text-gray-500 mt-0.5">Bulk/product sales — beef, eggs, etc. recorded via the Sales module</p>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product Type', 'Transactions', 'Total'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.income.byProductType.map(item => (
                    <tr key={item.productType} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 capitalize">{item.productType}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{item.count}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-green-700">{fmt(item.total)}</td>
                    </tr>
                  ))}
                  {report.income.byProductType.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-4 text-sm text-gray-500">No product sales recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Schedule F Expense Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Schedule F — Part II Expenses</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Schedule F Line / Bucket', 'Total'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.expenses.byScheduleF.map(item => (
                    <tr key={item.bucket} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">{item.bucket}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-red-700">{fmt(item.total)}</td>
                    </tr>
                  ))}
                  {report.expenses.byScheduleF.length === 0 && (
                    <tr><td colSpan={2} className="px-6 py-4 text-sm text-gray-500">No expenses recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Form 4562 / Schedule F Line 14d — Depreciation */}
            {report.depreciation && (report.depreciation.totalAmount > 0 || report.depreciation.assetCount > 0) && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Form 4562 / Schedule F Line 14d — Depreciation & Section 179</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Recorded via the Capital Assets register</p>
                </div>
                <div className="px-6 py-4 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Total Depreciation Deduction</p>
                    <p className="text-xl font-bold text-red-700">{fmt(report.depreciation.totalAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">Flows into Schedule F Line 14d</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-1">Assets with Depreciation Records</p>
                    <p className="text-xl font-bold text-gray-900">{report.depreciation.assetCount}</p>
                    <a href="/accounting/assets" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                      View capital assets register →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {report.depreciation && report.depreciation.totalAmount === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800">
                <strong>No depreciation recorded for {year}.</strong> If you have depreciable farm assets (machinery, buildings, land improvements),
                add them to the{' '}
                <a href="/accounting/assets" className="underline">capital assets register</a> and record annual depreciation for Schedule F Line 14d / Form 4562.
              </div>
            )}

            {/* Expense Breakdown by Category */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Expense Breakdown by Category</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Category', 'Schedule F Bucket', 'Transactions', 'Total'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.expenses.byCategory.map(item => (
                    <tr key={item.categoryId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{item.scheduleFBucket}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{item.count}</td>
                      <td className="px-6 py-3 text-sm font-semibold text-red-700">{fmt(item.total)}</td>
                    </tr>
                  ))}
                  {report.expenses.byCategory.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-sm text-gray-500">No expenses recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 italic">
              This report organises farm records to assist with Schedule F preparation. It does not constitute tax advice.
              Consult a qualified tax advisor before filing. Breeding, dairy, and draft animal sales are excluded from Schedule F
              and must be reported on IRS Form 4797.
            </p>
          </div>
        )}
      </PageWrapper>
    </>
  )
}
