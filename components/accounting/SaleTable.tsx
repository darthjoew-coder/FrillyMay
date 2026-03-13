'use client'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { ISale } from '@/types'
import { formatDate } from '@/lib/utils'

interface SaleTableProps {
  sales: ISale[]
  onDelete: (id: string, label: string) => void
}

function productTypeBadge(type: string) {
  if (type === 'beef') return <Badge variant="brown">Beef</Badge>
  if (type === 'eggs') return <Badge variant="yellow">Eggs</Badge>
  return <Badge variant="gray">Other</Badge>
}

export default function SaleTable({ sales, onDelete }: SaleTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Date', 'Product Type', 'Customer', 'Amount', 'Qty', 'Unit Price', 'Payment', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sales.map(sale => (
            <tr key={sale._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(sale.date)}</td>
              <td className="px-4 py-3">{productTypeBadge(sale.productType)}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{sale.customerName || '—'}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                {sale.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {sale.quantity != null ? `${sale.quantity} ${sale.unit || ''}`.trim() : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {sale.unitPrice != null
                  ? sale.unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                  : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                {sale.paymentMethod.replace('_', ' ')}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/accounting/sales/${sale._id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/accounting/sales/${sale._id}/edit`}
                    className="text-xs font-medium text-gray-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => onDelete(sale._id, `${sale.productType} sale on ${formatDate(sale.date)}`)}
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
  )
}
