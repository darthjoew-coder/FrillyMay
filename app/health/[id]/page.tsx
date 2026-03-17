import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import HealthTypeBadge from '@/components/health/HealthTypeBadge'
import { IHealthRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import { connectDB } from '@/lib/db'
import { HealthRecord } from '@/models/HealthRecord'

async function getRecord(id: string): Promise<IHealthRecord | null> {
  try {
    await connectDB()
    const doc = await HealthRecord.findById(id).populate('animalId', 'tagId name _id').lean()
    if (!doc) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = doc as any
    return { ...r, _id: String(r._id), animal: r.animalId ? { _id: String(r.animalId._id), tagId: r.animalId.tagId, name: r.animalId.name } : null } as IHealthRecord
  } catch { return null }
}

export default async function HealthDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await getRecord(id)
  if (!record) notFound()

  return (
    <>
      <TopBar title={record.title} subtitle={`Health Record · ${formatDate(record.date, 'long')}`} />
      <PageWrapper>
        <Card className="max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <HealthTypeBadge type={record.type} />
            {record.animal && (
              <Link href={`/animals/${record.animal._id}`} className="text-sm text-green-700 hover:underline font-medium">
                {record.animal.tagId}{record.animal.name ? ` (${record.animal.name})` : ''}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: 'Date', value: formatDate(record.date, 'long') },
              { label: 'Medication', value: record.medication || '—' },
              { label: 'Dosage', value: record.dosage || '—' },
              { label: 'Administered By', value: record.administeredBy || '—' },
              { label: 'Weight at Visit', value: record.weight ? `${record.weight} kg` : '—' },
              { label: 'Temperature', value: record.temperature ? `${record.temperature}°F` : '—' },
              { label: 'Cost', value: record.cost ? `$${record.cost.toFixed(2)}` : '—' },
              { label: 'Next Due Date', value: record.nextDueDate ? formatDate(record.nextDueDate, 'long') : '—' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-gray-500">{f.label}</p>
                <p className="text-sm font-medium text-gray-800">{f.value}</p>
              </div>
            ))}
          </div>
          {record.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-700">{record.description}</p>
            </div>
          )}
          {record.notes && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{record.notes}</p>
            </div>
          )}
        </Card>
      </PageWrapper>
    </>
  )
}
