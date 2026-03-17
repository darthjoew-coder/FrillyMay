import Link from 'next/link'
import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { connectDB } from '@/lib/db'
import { Expense } from '@/models/Expense'
import { Receipt } from '@/models/Receipt'
import { formatDate } from '@/lib/utils'

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const expense = await Expense.findById(id).populate('categoryId').lean()
  if (!expense) notFound()

  const receiptsRaw = await Receipt.find({ expenseId: id }).select('-imageData -thumbnailData -rawApiResponse').lean()
  const receipts = receiptsRaw as unknown as Record<string, unknown>[]

  const e = expense as unknown as Record<string, unknown>
  const category = e.categoryId as Record<string, unknown> | null

  function statusBadge(status: string) {
    if (status === 'finalized') return <Badge variant="green">Finalized</Badge>
    return <Badge variant="gray">Draft</Badge>
  }

  function productLineBadge(line: string) {
    if (line === 'beef') return <Badge variant="brown">Beef</Badge>
    if (line === 'eggs') return <Badge variant="yellow">Eggs</Badge>
    return <Badge variant="gray">General</Badge>
  }

  const amount = e.amount as number

  return (
    <>
      <TopBar
        title={String(e.vendor)}
        subtitle={formatDate(String(e.date))}
        actions={
          <div className="flex gap-2">
            <Link href="/accounting/expenses"><Button variant="secondary">← Back</Button></Link>
            <Link href={`/accounting/expenses/${id}/edit`}><Button>Edit</Button></Link>
          </div>
        }
      />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          {/* Main Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Expense Details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(String(e.date))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax Year</p>
                <p className="text-sm font-medium text-gray-900">{String(e.taxYear)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vendor</p>
                <p className="text-sm font-medium text-gray-900">{String(e.vendor)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p className="text-sm font-bold text-gray-900">
                  {amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium text-gray-900">{category ? String(category.name) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Subcategory</p>
                <p className="text-sm font-medium text-gray-900">{e.subcategory ? String(e.subcategory) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {String(e.paymentMethod).replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Product Line</p>
                <div className="mt-0.5">{productLineBadge(String(e.productLine))}</div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-0.5">{statusBadge(String(e.status))}</div>
              </div>
              {category && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Schedule F Bucket</p>
                  <p className="text-sm font-medium text-gray-900">{String(category.scheduleFBucket)}</p>
                </div>
              )}
            </div>

            {!!e.description && (
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-700 mt-0.5">{String(e.description)}</p>
              </div>
            )}
            {!!e.notes && (
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{String(e.notes)}</p>
              </div>
            )}
          </div>

          {/* Receipts */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Receipts ({receipts.length})
            </h2>
            {receipts.length === 0 ? (
              <p className="text-sm text-gray-500">
                No receipts attached.{' '}
                <Link href={`/accounting/expenses/${id}/edit`} className="text-blue-600 hover:underline">
                  Edit this expense
                </Link>{' '}
                to upload receipts.
              </p>
            ) : (
              <ul className="space-y-2">
                {receipts.map(r => (
                  <li key={String(r._id)} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <a
                        href={`/api/accounting/receipts/${String(r._id)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {String(r.fileName)}
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.source === 'mobile'
                          ? `Mobile capture${r.merchantName ? ` · ${String(r.merchantName)}` : ''}`
                          : `${((r.imageSize as number || r.fileSize as number || 0) / 1024).toFixed(1)} KB · ${String(r.imageMimeType || r.mimeType || '')}`
                        }
                      </p>
                    </div>
                    <a
                      href={`/api/accounting/receipts/${String(r._id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
