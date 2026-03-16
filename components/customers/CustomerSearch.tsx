'use client'
import { useState, useEffect, useRef } from 'react'
import { ICustomer } from '@/types'

interface CustomerSearchProps {
  value: string        // customerId
  displayValue: string // display name shown in input
  onChange: (customerId: string, displayName: string) => void
  label?: string
  placeholder?: string
}

export default function CustomerSearch({
  value,
  displayValue,
  onChange,
  label = 'Customer (optional)',
  placeholder = 'Search by name...',
}: CustomerSearchProps) {
  const [query, setQuery] = useState(displayValue)
  const [results, setResults] = useState<ICustomer[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep query in sync when parent resets
  useEffect(() => { setQuery(displayValue) }, [displayValue])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function search(q: string) {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&isActive=true&limit=10`)
      const data = await res.json()
      setResults(data.data || [])
    } finally {
      setLoading(false)
    }
  }

  function handleInput(q: string) {
    setQuery(q)
    setOpen(true)
    if (!q) {
      onChange('', '')
      setResults([])
    } else {
      search(q)
    }
  }

  function handleSelect(c: ICustomer) {
    onChange(c._id, c.displayName)
    setQuery(c.displayName)
    setOpen(false)
    setResults([])
  }

  function handleClear() {
    onChange('', '')
    setQuery('')
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => query && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 pr-8"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Clear customer"
          >
            ✕
          </button>
        )}
      </div>
      {open && (query.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
          )}
          {results.map(c => (
            <button
              key={c._id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-800 border-b border-gray-50 last:border-0"
            >
              <span className="font-medium">{c.displayName}</span>
              {c.businessName && c.businessName !== c.displayName && (
                <span className="text-gray-500 ml-2 text-xs">{c.businessName}</span>
              )}
              {c.email && <span className="text-gray-400 ml-2 text-xs">{c.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
