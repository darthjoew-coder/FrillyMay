'use client'
import Link from 'next/link'
import { IFeedingRecord } from '@/types'
import { formatDate, capitalize } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

interface FeedingTableProps {
  records: IFeedingRecord[]
  onDelete?: (id: string) => void
}

export default function FeedingTable({ records, onDelete }: FeedingTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Animal / Group</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Feed Type</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Quantity</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Water</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600">{r.isScheduleTemplate ? '—' : formatDate(r.date)}</td>
              <td className="px-4 py-3">
                {r.animal ? (
                  <Link href={`/animals/${r.animal._id}`} className="text-green-700 hover:underline font-medium">
                    {r.animal.tagId}{r.animal.name ? ` (${r.animal.name})` : ''}
                  </Link>
                ) : r.groupName ? (
                  <span className="text-gray-700 font-medium">{r.groupName}</span>
                ) : '—'}
              </td>
              <td className="px-4 py-3">
                <Badge variant="brown">{capitalize(r.feedType)}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{r.quantity ? `${r.quantity} ${r.unit || ''}` : '—'}</td>
              <td className="px-4 py-3 text-gray-600">{r.feedingTime ? capitalize(r.feedingTime) : '—'}</td>
              <td className="px-4 py-3 text-gray-600">{r.waterAccess ? capitalize(r.waterAccess) : '—'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/feeding/${r._id}`} className="text-xs text-blue-600 hover:underline">View</Link>
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
