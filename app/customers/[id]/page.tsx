import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { connectDB } from '@/lib/db'
import { Customer } from '@/models/Customer'
import { Sale } from '@/models/Sale'
import { formatDate } from '@/lib/utils'
import { ICustomer, ISale } from '@/types'
import mongoose from 'mongoose'

async function getData(id: string) {
  try {
  await connectDB()

  const doc = await Customer.findById(id).lean()
  if (!doc) return null

  const customer = JSON.parse(JSON.stringify(doc)) as ICustomer

  const currentYear = new Date().getFullYear()
  const objectId = new mongoose.Types.ObjectId(id)

  const [lifetimeAgg, ytdAgg, recentSalesRaw] = await Promise.all([
    Sale.aggregate([
      { $match: { customerId: objectId } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Sale.aggregate([
      { $match: { customerId: objectId, taxYear: currentYear } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Sale.find({ customerId: objectId }).sort({ date: -1 }).limit(20).lean(),
  ])

  const lifetimeTotal: number = lifetimeAgg[0]?.total ?? 0
  const orderCount: number = lifetimeAgg[0]?.count ?? 0
  const ytdTotal: number = ytdAgg[0]?.total ?? 0

  const summary = {
    lifetimeTotal,
    ytdTotal,
    orderCount,
    avgSale: orderCount > 0 ? lifetimeTotal / orderCount : 0,
  }

  const recentSales = JSON.parse(JSON.stringify(recentSalesRaw)) as ISale[]

  return { customer, summary, recentSales }
  } catch { return null }
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getData(id)
  if (!result) notFound()

  const { customer, summary, recentSales } = result

  return (
    <>
      <TopBar
        title={customer.displayName}
        subtitle={customer.businessName && customer.businessName !== customer.displayName ? customer.businessName : undefined}
        actions={
          <div className="flex gap-2">
            <Link href={`/customers/${id}/edit`}>
              <Button size="sm" variant="secondary">Edit</Button>
            </Link>
            <Link href={`/accounting/sales/new`}>
              <Button size="sm">+ Record Sale</Button>
            </Link>
          </div>
        }
      />
      <PageWrapper>
        <div className="max-w-4xl space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Lifetime Sales</p>
              <p className="text-2xl font-bold text-green-700">{fmt(summary.lifetimeTotal)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">This Year</p>
              <p className="text-2xl font-bold text-green-700">{fmt(summary.ytdTotal)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{summary.orderCount}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg. Sale</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(summary.avgSale)}</p>
            </div>
          </div>

          {/* Customer info */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Customer Info</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                customer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {customer.email && (
                <div><p className="text-xs text-gray-500">Email</p><p className="text-sm font-medium text-gray-800">{customer.email}</p></div>
              )}
              {customer.phone && (
                <div><p className="text-xs text-gray-500">Phone</p><p className="text-sm font-medium text-gray-800">{customer.phone}</p></div>
              )}
              {(customer.city || customer.state) && (
                <div><p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-800">
                    {[customer.addressLine1, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {customer.tags && customer.tags.length > 0 && (
                <div><p className="text-xs text-gray-500">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {customer.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 capitalize">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              <div><p className="text-xs text-gray-500">Added</p><p className="text-sm font-medium text-gray-800">{formatDate(customer.createdAt)}</p></div>
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            )}
          </Card>

          {/* Recent sales */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Sales History</h2>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-500">No sales recorded for this customer yet.</p>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date', 'Product', 'Qty', 'Amount', 'Payment', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentSales.map(s => (
                      <tr key={s._id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-700">{formatDate(s.date)}</td>
                        <td className="px-4 py-2.5 text-gray-700 capitalize">{s.productType}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.quantity ? `${s.quantity} ${s.unit || ''}`.trim() : '—'}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{fmt(s.totalAmount)}</td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{s.paymentMethod.replace('_', ' ')}</td>
                        <td className="px-4 py-2.5">
                          <Link href={`/accounting/sales/${s._id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
