import Link from 'next/link'
import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { connectDB } from '@/lib/db'
import { Sale } from '@/models/Sale'
import { formatDate } from '@/lib/utils'

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const sale = await Sale.findById(id).lean()
  if (!sale) notFound()

  const s = sale as unknown as Record<string, unknown>

  function productTypeBadge(type: string) {
    if (type === 'beef') return <Badge variant="brown">Beef</Badge>
    if (type === 'eggs') return <Badge variant="yellow">Eggs</Badge>
    return <Badge variant="gray">Other</Badge>
  }

  const totalAmount = s.totalAmount as number
  const unitPrice = s.unitPrice as number | undefined

  return (
    <>
      <TopBar
        title={`${String(s.productType).charAt(0).toUpperCase() + String(s.productType).slice(1)} Sale`}
        subtitle={formatDate(String(s.date))}
        actions={
          <div className="flex gap-2">
            <Link href="/accounting/sales"><Button variant="secondary">← Back</Button></Link>
            <Link href={`/accounting/sales/${id}/edit`}><Button>Edit</Button></Link>
          </div>
        }
      />
      <PageWrapper>
        <div className="max-w-2xl">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sale Details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(String(s.date))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax Year</p>
                <p className="text-sm font-medium text-gray-900">{String(s.taxYear)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Product Type</p>
                <div className="mt-0.5">{productTypeBadge(String(s.productType))}</div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Amount</p>
                <p className="text-sm font-bold text-green-700">
                  {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Quantity</p>
                <p className="text-sm font-medium text-gray-900">
                  {s.quantity != null ? `${s.quantity} ${s.unit || ''}`.trim() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit Price</p>
                <p className="text-sm font-medium text-gray-900">
                  {unitPrice != null
                    ? unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Customer</p>
                <p className="text-sm font-medium text-gray-900">{s.customerName ? String(s.customerName) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {String(s.paymentMethod).replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reference #</p>
                <p className="text-sm font-medium text-gray-900">{s.referenceNumber ? String(s.referenceNumber) : '—'}</p>
              </div>
            </div>
            {s.notes && (
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{String(s.notes)}</p>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
