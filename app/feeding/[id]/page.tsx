import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { IFeedingRecord } from '@/types'
import { formatDate, capitalize } from '@/lib/utils'

async function getRecord(id: string): Promise<IFeedingRecord | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/feeding/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()).data
  } catch { return null }
}

export default async function FeedingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await getRecord(id)
  if (!record) notFound()

  return (
    <>
      <TopBar title={`Feeding: ${capitalize(record.feedType)}`}
        subtitle={record.isScheduleTemplate ? 'Schedule Template' : formatDate(record.date, 'long')} />
      <PageWrapper>
        <Card className="max-w-2xl">
          {record.isScheduleTemplate && <Badge variant="blue" className="mb-4">Schedule Template</Badge>}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: 'Animal / Group', value: record.animal ? `${record.animal.tagId}${record.animal.name ? ` (${record.animal.name})` : ''}` : record.groupName || '—' },
              { label: 'Feed Type', value: capitalize(record.feedType) },
              { label: 'Feed Brand', value: record.feedBrand || '—' },
              { label: 'Quantity', value: record.quantity ? `${record.quantity} ${record.unit || ''}` : '—' },
              { label: 'Feeding Time', value: record.feedingTime ? capitalize(record.feedingTime) : '—' },
              { label: 'Water Access', value: record.waterAccess ? capitalize(record.waterAccess) : '—' },
              { label: record.isScheduleTemplate ? 'Frequency' : 'Date', value: record.isScheduleTemplate ? (record.scheduleFrequency ? capitalize(record.scheduleFrequency) : '—') : formatDate(record.date) },
              { label: 'Cost', value: record.cost ? `$${record.cost.toFixed(2)}` : '—' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-500">{f.label}</p>
                <p className="text-sm font-medium text-gray-800">{f.value}</p>
              </div>
            ))}
          </div>
          {record.waterNotes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Water Notes</p>
              <p className="text-sm text-gray-700">{record.waterNotes}</p>
            </div>
          )}
          {record.notes && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{record.notes}</p>
            </div>
          )}
          {record.animal && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href={`/animals/${record.animal._id}`} className="text-sm text-green-700 hover:underline">
                View Animal Profile →
              </Link>
            </div>
          )}
        </Card>
      </PageWrapper>
    </>
  )
}
