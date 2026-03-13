'use client'
import Link from 'next/link'
import { IHealthRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import HealthTypeBadge from './HealthTypeBadge'

interface HealthLogTableProps {
  records: IHealthRecord[]
  onDelete?: (id: string) => void
}

export default function HealthLogTable({ records, onDelete }: HealthLogTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Animal</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Next Due</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Cost</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600">{formatDate(r.date)}</td>
              <td className="px-4 py-3">
                {r.animal ? (
                  <Link href={`/animals/${r.animal._id}`} className="text-green-700 hover:underline font-medium">
                    {r.animal.tagId}{r.animal.name ? ` (${r.animal.name})` : ''}
                  </Link>
                ) : '—'}
              </td>
              <td className="px-4 py-3"><HealthTypeBadge type={r.type} /></td>
              <td className="px-4 py-3 font-medium text-gray-800">{r.title}</td>
              <td className="px-4 py-3 text-gray-600">{r.nextDueDate ? formatDate(r.nextDueDate) : '—'}</td>
              <td className="px-4 py-3 text-gray-600">{r.cost ? `$${r.cost.toFixed(2)}` : '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/health/${r._id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  {onDelete && (
                    <button onClick={() => onDelete(r._id)} className="text-xs text-red-500 hover:underline cursor-pointer">Delete</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
