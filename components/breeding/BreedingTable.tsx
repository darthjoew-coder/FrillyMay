'use client'
import Link from 'next/link'
import { IBreedingEvent } from '@/types'
import { formatDate, capitalize } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import PregnancyCountdown from './PregnancyCountdown'

interface BreedingTableProps {
  events: IBreedingEvent[]
  onDelete?: (id: string) => void
}

const statusVariant: Record<string, 'yellow' | 'blue' | 'gray' | 'green' | 'red'> = {
  pending: 'yellow',
  confirmed_pregnant: 'blue',
  not_pregnant: 'gray',
  delivered: 'green',
  lost: 'red',
}

export default function BreedingTable({ events, onDelete }: BreedingTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Breeding Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Dam (Mother)</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Sire (Father)</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Method</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Expected Due</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Countdown</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-600">{formatDate(e.breedingDate)}</td>
              <td className="px-4 py-3">
                {e.dam ? (
                  <Link href={`/animals/${e.dam._id}`} className="text-green-700 hover:underline font-medium">
                    {e.dam.tagId}{e.dam.name ? ` (${e.dam.name})` : ''}
                  </Link>
                ) : '—'}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {e.sire ? (
                  <Link href={`/animals/${e.sire._id}`} className="text-green-700 hover:underline">{e.sire.tagId}</Link>
                ) : e.sireExternal || '—'}
              </td>
              <td className="px-4 py-3 text-gray-600 uppercase text-xs">{e.method}</td>
              <td className="px-4 py-3">
                <Badge variant={statusVariant[e.status] || 'gray'}>{capitalize(e.status)}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">{e.expectedDueDate ? formatDate(e.expectedDueDate) : '—'}</td>
              <td className="px-4 py-3">
                <PregnancyCountdown expectedDueDate={e.expectedDueDate} status={e.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/breeding/${e._id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  {onDelete && (
                    <button onClick={() => onDelete(e._id)} className="text-xs text-red-500 hover:underline cursor-pointer">Delete</button>
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
