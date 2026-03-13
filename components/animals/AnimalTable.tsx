'use client'
import Link from 'next/link'
import { IAnimal } from '@/types'
import { calculateAge, formatDate } from '@/lib/utils'
import { SPECIES_EMOJI } from '@/lib/constants'
import AnimalStatusBadge from './AnimalStatusBadge'

interface AnimalTableProps {
  animals: IAnimal[]
  onDelete?: (id: string, name: string) => void
}

export default function AnimalTable({ animals, onDelete }: AnimalTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Tag ID</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Species</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Breed</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Sex</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Age</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Weight</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Location</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {animals.map(a => (
            <tr key={a._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/animals/${a._id}`} className="font-medium text-green-700 hover:underline">
                  {a.tagId}
                </Link>
                {a.name && <span className="text-gray-500 ml-1.5 text-xs">({a.name})</span>}
              </td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-1.5">
                  {SPECIES_EMOJI[a.species] || '🐾'} {a.species.charAt(0).toUpperCase() + a.species.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">{a.breed || '—'}</td>
              <td className="px-4 py-3 text-gray-600 capitalize">{a.sex}</td>
              <td className="px-4 py-3 text-gray-600">{a.dateOfBirth ? calculateAge(a.dateOfBirth) : '—'}</td>
              <td className="px-4 py-3 text-gray-600">{a.currentWeight ? `${a.currentWeight} kg` : '—'}</td>
              <td className="px-4 py-3 text-gray-600">{a.location || '—'}</td>
              <td className="px-4 py-3"><AnimalStatusBadge status={a.status} /></td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/animals/${a._id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                  {onDelete && (
                    <button onClick={() => onDelete(a._id, a.tagId)} className="text-xs text-red-500 hover:underline cursor-pointer">Delete</button>
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
