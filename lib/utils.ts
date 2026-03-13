import { GESTATION_DAYS } from './constants'

export function calculateAge(dob: string | Date): string {
  if (!dob) return 'Unknown'
  const birth = new Date(dob)
  const now = new Date()
  const diffMs = now.getTime() - birth.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days < 0) return 'Unknown'
  if (days < 30) return `${days}d`
  if (days < 365) {
    const months = Math.floor(days / 30)
    return `${months}mo`
  }
  const years = Math.floor(days / 365)
  const remainingMonths = Math.floor((days % 365) / 30)
  return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`
}

export function formatDate(date: string | Date | undefined, format: 'short' | 'long' = 'short'): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', format === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' }
  )
}

export function getDaysUntil(date: string | Date | undefined): number {
  if (!date) return 0
  const d = new Date(date)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getGestationProgress(breedingDate: Date | string, species: string): number {
  const days = GESTATION_DAYS[species] || 150
  const start = new Date(breedingDate)
  const now = new Date()
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.min(100, Math.max(0, Math.round((elapsed / days) * 100)))
}

export function capitalize(str: string): string {
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) p.append(k, String(v))
  })
  return p.toString()
}
