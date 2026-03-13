'use client'
import { useState, useEffect, useRef } from 'react'
import { IAnimal } from '@/types'

interface AnimalTagSearchProps {
  label: string
  value: string
  onChange: (id: string) => void
  initialTag?: string
  required?: boolean
  optional?: boolean
  placeholder?: string
}

export default function AnimalTagSearch({
  label, value, onChange, initialTag, required, optional, placeholder = 'Type tag number...',
}: AnimalTagSearchProps) {
  const [inputText, setInputText] = useState(initialTag || '')
  const [results, setResults] = useState<IAnimal[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(!!(initialTag && value))
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function search(q: string) {
    if (!q) { setResults([]); setOpen(false); return }
    const res = await fetch(`/api/animals?search=${encodeURIComponent(q)}&status=active&limit=8`)
    const data = await res.json()
    setResults(data.data || [])
    setOpen(true)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setInputText(v)
    setSelected(false)
    onChange('')
    search(v)
  }

  function handleSelect(animal: IAnimal) {
    const display = animal.name ? `${animal.tagId} – ${animal.name}` : animal.tagId
    setInputText(display)
    setSelected(true)
    onChange(animal._id)
    setResults([])
    setOpen(false)
  }

  function handleClear() {
    setInputText('')
    setSelected(false)
    onChange('')
    setResults([])
  }

  const inputId = label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div ref={ref} className="flex flex-col gap-1 relative">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && <span className="text-gray-400 ml-1 font-normal">(optional)</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={inputText}
          onChange={handleInput}
          onFocus={() => { if (results.length) setOpen(true) }}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-md border px-3 py-2 pr-8 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-green-600 focus:ring-2 focus:ring-green-100 ${selected ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>
      {/* Hidden input to satisfy required validation */}
      {required && (
        <input
          type="text"
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {results.map(animal => (
            <li key={animal._id}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex items-center justify-between gap-2"
                onMouseDown={() => handleSelect(animal)}
              >
                <span>
                  <span className="font-semibold text-gray-900">{animal.tagId}</span>
                  {animal.name && <span className="text-gray-500 ml-1.5">– {animal.name}</span>}
                </span>
                <span className="text-xs text-gray-400 capitalize shrink-0">{animal.species}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && inputText && results.length === 0 && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow px-4 py-3 text-sm text-gray-500">
          No active animals found for "{inputText}"
        </div>
      )}
    </div>
  )
}
