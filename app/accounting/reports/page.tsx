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
    rows.push('=== INCOME ===')
    rows.push('Product Type,Amount,Count')
    for (const item of report.income.byProductType) {
      rows.push(`${item.productType},${item.total},${item.count}`)
    }
    rows.push(`Total Income,,${report.income.totalAmount}`)
    rows.push('')
    rows.push('=== SCHEDULE F EXPENSES ===')
    rows.push('Line,Description,Amount')
    for (const item of report.expenses.byScheduleF) {
      rows.push(`${item.bucket},,${item.total}`)
    }
    rows.push(`Total Expenses,,${report.expenses.totalAmount}`)
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
                <p className="text-2xl font-bold text-green-700">
                  {report.income.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  {report.expenses.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Net Farm Income</p>
                <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {net.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
            </div>

            {/* Income by Product Type */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Income by Product Type</h2>
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
                      <td className="px-6 py-3 text-sm font-semibold text-green-700">
                        {item.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                    </tr>
                  ))}
                  {report.income.byProductType.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-4 text-sm text-gray-500">No income recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Schedule F Expense Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Schedule F Expense Breakdown</h2>
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
                      <td className="px-6 py-3 text-sm font-semibold text-red-700">
                        {item.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                    </tr>
                  ))}
                  {report.expenses.byScheduleF.length === 0 && (
                    <tr><td colSpan={2} className="px-6 py-4 text-sm text-gray-500">No expenses recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

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
                      <td className="px-6 py-3 text-sm font-semibold text-red-700">
                        {item.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </td>
                    </tr>
                  ))}
                  {report.expenses.byCategory.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-4 text-sm text-gray-500">No expenses recorded.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageWrapper>
    </>
  )
}
