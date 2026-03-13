'use client'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { IExpense } from '@/types'
import { formatDate } from '@/lib/utils'

interface ExpenseTableProps {
  expenses: IExpense[]
  onDelete: (id: string, vendor: string) => void
}

function productLineBadge(line: string) {
  if (line === 'beef') return <Badge variant="brown">Beef</Badge>
  if (line === 'eggs') return <Badge variant="yellow">Eggs</Badge>
  return <Badge variant="gray">General</Badge>
}

function statusBadge(status: string) {
  if (status === 'finalized') return <Badge variant="green">Finalized</Badge>
  return <Badge variant="gray">Draft</Badge>
}

export default function ExpenseTable({ expenses, onDelete }: ExpenseTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Date', 'Vendor', 'Category', 'Product Line', 'Amount', 'Payment Method', 'Status', 'Receipts', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {expenses.map(expense => (
            <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(expense.date)}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{expense.vendor}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{expense.category?.name || '—'}</td>
              <td className="px-4 py-3">{productLineBadge(expense.productLine)}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                {expense.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                {expense.paymentMethod.replace('_', ' ')}
              </td>
              <td className="px-4 py-3">{statusBadge(expense.status)}</td>
              <td className="px-4 py-3">
                {expense.receiptCount && expense.receiptCount > 0 ? (
                  <Badge variant="blue">{expense.receiptCount}</Badge>
                ) : (
                  <span className="text-gray-400 text-sm">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/accounting/expenses/${expense._id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/accounting/expenses/${expense._id}/edit`}
                    className="text-xs font-medium text-gray-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => onDelete(expense._id, expense.vendor)}
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
