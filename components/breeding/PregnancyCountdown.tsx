import { getDaysUntil } from '@/lib/utils'

interface PregnancyCountdownProps {
  expectedDueDate: string | undefined
  status: string
}

export default function PregnancyCountdown({ expectedDueDate, status }: PregnancyCountdownProps) {
  if (!expectedDueDate || status === 'delivered' || status === 'lost' || status === 'not_pregnant') {
    return <span className="text-gray-400 text-xs">—</span>
  }

  const days = getDaysUntil(expectedDueDate)

  if (days < 0) {
    return <span className="text-red-600 text-xs font-semibold">Overdue by {Math.abs(days)}d</span>
  }
  if (days === 0) {
    return <span className="text-red-600 text-xs font-semibold animate-pulse">Due today!</span>
  }
  if (days <= 7) {
    return <span className="text-red-500 text-xs font-semibold">In {days} day{days !== 1 ? 's' : ''}</span>
  }
  if (days <= 30) {
    return <span className="text-yellow-600 text-xs font-medium">In {days} days</span>
  }
  return <span className="text-green-600 text-xs">{days} days</span>
}
