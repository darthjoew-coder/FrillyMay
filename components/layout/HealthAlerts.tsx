'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UpcomingEvent {
  _id: string
  animalId: string
  animal: { tagId: string; name?: string } | null
  title: string
  type: string
  scheduledDate: string
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function HealthAlerts() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])

  useEffect(() => {
    fetch('/api/health/upcoming')
      .then(r => r.json())
      .then(d => setEvents(d.data || []))
      .catch(() => {})
  }, [])

  if (events.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap overflow-hidden max-w-xl">
      {events.map(e => {
        const days = daysUntil(e.scheduledDate)
        const label = e.animal ? (e.animal.name || e.animal.tagId) : 'Animal'
        return (
          <Link
            key={e._id}
            href={`/health/${e._id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 whitespace-nowrap"
          >
            <span>🔔</span>
            <span>{e.title} — {label}</span>
            <span className="text-amber-600">({days === 0 ? 'today' : `${days}d`})</span>
          </Link>
        )
      })}
    </div>
  )
}
