'use client'
import Link from 'next/link'
import { ICustomer } from '@/types'

interface CustomerTableProps {
  customers: ICustomer[]
  onDelete?: (id: string, name: string) => void
}

export default function CustomerTable({ customers, onDelete }: CustomerTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Tags</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map(c => (
            <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/customers/${c._id}`} className="font-medium text-green-700 hover:underline">
                  {c.displayName}
                </Link>
                {c.businessName && c.businessName !== c.displayName && (
                  <p className="text-xs text-gray-500">{c.businessName}</p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {c.email && <p className="text-xs">{c.email}</p>}
                {c.phone && <p className="text-xs">{c.phone}</p>}
                {!c.email && !c.phone && '—'}
              </td>
              <td className="px-4 py-3">
                {c.tags && c.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 capitalize">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link href={`/customers/${c._id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  <Link href={`/customers/${c._id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(c._id, c.displayName)}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
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
