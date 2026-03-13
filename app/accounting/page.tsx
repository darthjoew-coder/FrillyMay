'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { IAccountingReport, IExpense } from '@/types'
import { formatDate } from '@/lib/utils'

const currentYear = new Date().getFullYear()
const yearOptions = [-2, -1, 0, 1, 2].map(offset => ({
  value: String(currentYear + offset),
  label: String(currentYear + offset),
}))

export default function AccountingPage() {
  const [year, setYear] = useState(currentYear)
  const [report, setReport] = useState<IAccountingReport | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<IExpense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [reportRes, expensesRes] = await Promise.all([
      fetch(`/api/accounting/reports?year=${year}`),
      fetch(`/api/accounting/expenses?year=${year}&limit=5`),
    ])
    const reportData = await reportRes.json()
    const expensesData = await expensesRes.json()
    setReport(reportData.data || null)
    setRecentExpenses(expensesData.data || [])
    setLoading(false)
  }, [year])

  useEffect(() => { fetchData() }, [fetchData])

  const net = report?.netIncome ?? 0

  return (
    <>
      <TopBar
        title="Accounting"
        subtitle={`Tax Year ${year}`}
        actions={
          <div className="w-36">
            <Select
              value={String(year)}
              onChange={e => setYear(Number(e.target.value))}
              options={yearOptions}
            />
          </div>
        }
      />
      <PageWrapper>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Income</p>
                <p className="text-2xl font-bold text-green-700">
                  {(report?.income.totalAmount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  {(report?.expenses.totalAmount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Net Income</p>
                <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {net.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Missing Receipts</p>
                <p className="text-2xl font-bold text-amber-700">{report?.missingReceipts ?? 0}</p>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { href: '/accounting/expenses', label: 'Expenses', icon: '🧾', desc: 'Log & manage farm expenses' },
                { href: '/accounting/sales', label: 'Sales', icon: '💵', desc: 'Record livestock & product sales' },
                { href: '/accounting/reports', label: 'Reports', icon: '📊', desc: 'Schedule F tax reports' },
                { href: '/accounting/categories', label: 'Categories', icon: '🏷️', desc: 'Manage expense categories' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-sm transition-all group"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-gray-900 group-hover:text-amber-700">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </Link>
              ))}
            </div>

            {/* Recent Expenses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900">Recent Expenses</h2>
                <Link href="/accounting/expenses" className="text-sm text-blue-600 hover:underline">View all →</Link>
              </div>
              {recentExpenses.length === 0 ? (
                <p className="text-sm text-gray-500">No expenses recorded for {year}.</p>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Date', 'Vendor', 'Category', 'Amount', 'Status'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentExpenses.map(e => (
                        <tr key={e._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-sm text-gray-700">{formatDate(e.date)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                            <Link href={`/accounting/expenses/${e._id}`} className="hover:underline">{e.vendor}</Link>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{e.category?.name || '—'}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">
                            {e.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-600 capitalize">{e.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </PageWrapper>
    </>
  )
}
