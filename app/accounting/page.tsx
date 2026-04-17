'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Select from '@/components/ui/Select'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { IAccountingReport, IDashboardTiles, IExpense } from '@/types'
import { formatDate } from '@/lib/utils'

const currentYear = new Date().getFullYear()
const yearOptions = [-2, -1, 0, 1, 2].map(offset => ({
  value: String(currentYear + offset),
  label: String(currentYear + offset),
}))

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

const PRODUCT_EMOJI: Record<string, string> = { beef: '🥩', eggs: '🥚', other: '🌾' }

export default function AccountingPage() {
  const [year, setYear] = useState(currentYear)
  const [report, setReport] = useState<IAccountingReport | null>(null)
  const [tiles, setTiles] = useState<IDashboardTiles | null>(null)
  const [recentExpenses, setRecentExpenses] = useState<IExpense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [reportRes, expensesRes, tilesRes] = await Promise.all([
      fetch(`/api/accounting/reports?year=${year}`),
      fetch(`/api/accounting/expenses?year=${year}&limit=5`),
      fetch(`/api/accounting/dashboard?year=${year}`),
    ])
    const [reportData, expensesData, tilesData] = await Promise.all([
      reportRes.json(),
      expensesRes.json(),
      tilesRes.json(),
    ])
    setReport(reportData.data || null)
    setRecentExpenses(expensesData.data || [])
    setTiles(tilesData.data || null)
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
            <Select value={String(year)} onChange={e => setYear(Number(e.target.value))} options={yearOptions} />
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
                <p className="text-2xl font-bold text-green-700">{fmt(report?.income.totalAmount ?? 0)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">{fmt(report?.expenses.totalAmount ?? 0)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Net Income</p>
                <p className={`text-2xl font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(net)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Missing Receipts</p>
                <p className="text-2xl font-bold text-amber-700">{report?.missingReceipts ?? 0}</p>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { href: '/accounting/expenses', label: 'Expenses', icon: '🧾', desc: 'Log & manage farm expenses' },
                { href: '/accounting/sales', label: 'Sales', icon: '💵', desc: 'Record livestock & product sales' },
                { href: '/accounting/equity', label: 'Owner Equity', icon: '🏦', desc: 'Contributions & draws — basis tracking' },
                { href: '/accounting/assets', label: 'Capital Assets', icon: '🏗️', desc: 'Depreciation register (Form 4562)' },
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

            {/* Dashboard tiles row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Month-over-month */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Monthly Sales — {year}</h2>
                <div className="space-y-2">
                  {(tiles?.monthlyTotals ?? []).map(m => {
                    const maxVal = Math.max(...(tiles?.monthlyTotals ?? []).map(x => x.total), 1)
                    const pct = Math.round((m.total / maxVal) * 100)
                    return (
                      <div key={m.month} className="flex items-center gap-2 text-xs">
                        <span className="w-8 text-gray-500 shrink-0">{m.label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-16 text-right text-gray-700 font-medium shrink-0">{fmt(m.total)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Sales by product */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Sales by Product — {year}</h2>
                {(tiles?.salesByProduct ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No sales recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {(tiles?.salesByProduct ?? []).map(p => (
                      <div key={p.productType} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{PRODUCT_EMOJI[p.productType] || '🌾'}</span>
                          <span className="text-sm text-gray-700 capitalize">{p.productType}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{fmt(p.total)}</p>
                          {p.quantity !== null && p.quantity > 0 && (
                            <p className="text-xs text-gray-500">{p.quantity.toLocaleString()} units</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top customers */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-800">Top Customers — {year}</h2>
                  <Link href="/customers" className="text-xs text-blue-600 hover:underline">All →</Link>
                </div>
                {(tiles?.topCustomers ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No customer-linked sales yet.</p>
                ) : (
                  <ol className="space-y-2">
                    {(tiles?.topCustomers ?? []).map((c, i) => (
                      <li key={c.customerId} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400 w-4 text-xs font-semibold">{i + 1}.</span>
                        <Link href={`/customers/${c.customerId}`} className="text-green-700 hover:underline flex-1 truncate">
                          {c.displayName}
                        </Link>
                        <span className="font-medium text-gray-900 shrink-0">{fmt(c.total)}</span>
                        <span className="text-xs text-gray-500 shrink-0">({c.count})</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
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
                          <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
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
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{fmt(e.amount)}</td>
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
