import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import PregnancyCountdown from '@/components/breeding/PregnancyCountdown'
import { IBreedingEvent } from '@/types'
import { formatDate, capitalize, getGestationProgress } from '@/lib/utils'

async function getEvent(id: string): Promise<IBreedingEvent | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/breeding/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()).data
  } catch { return null }
}

const statusVariant: Record<string, 'yellow' | 'blue' | 'gray' | 'green' | 'red'> = {
  pending: 'yellow', confirmed_pregnant: 'blue', not_pregnant: 'gray', delivered: 'green', lost: 'red',
}

export default async function BreedingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  const progress = event.status === 'confirmed_pregnant' || event.status === 'pending'
    ? getGestationProgress(event.breedingDate, event.species)
    : null

  return (
    <>
      <TopBar title="Breeding Event" subtitle={`${event.species} · ${formatDate(event.breedingDate, 'long')}`} />
      <PageWrapper>
        <div className="max-w-2xl space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <Badge variant={statusVariant[event.status] || 'gray'}>{capitalize(event.status)}</Badge>
              <PregnancyCountdown expectedDueDate={event.expectedDueDate} status={event.status} />
            </div>

            {progress !== null && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Gestation Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'Dam (Mother)', value: event.dam ? `${event.dam.tagId}${event.dam.name ? ` (${event.dam.name})` : ''}` : '—' },
                { label: 'Sire (Father)', value: event.sire ? event.sire.tagId : event.sireExternal || '—' },
                { label: 'Species', value: capitalize(event.species) },
                { label: 'Method', value: event.method?.toUpperCase() || '—' },
                { label: 'Breeding Date', value: formatDate(event.breedingDate, 'long') },
                { label: 'Expected Due Date', value: event.expectedDueDate ? formatDate(event.expectedDueDate, 'long') : '—' },
                { label: 'Gestation Days', value: event.gestationDays?.toString() || '—' },
                { label: 'Confirmation Date', value: event.confirmationDate ? formatDate(event.confirmationDate) : '—' },
                { label: 'Confirmation Method', value: event.confirmationMethod || '—' },
                { label: 'Actual Delivery', value: event.actualDeliveryDate ? formatDate(event.actualDeliveryDate) : '—' },
                { label: 'Offspring Count', value: event.offspringCount?.toString() || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-500">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800">{f.value}</p>
                </div>
              ))}
            </div>

            {event.offspringNotes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Offspring Notes</p>
                <p className="text-sm text-gray-700">{event.offspringNotes}</p>
              </div>
            )}
            {event.notes && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{event.notes}</p>
              </div>
            )}

            {event.dam && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                <Link href={`/animals/${event.dam._id}`} className="text-sm text-green-700 hover:underline">View Dam Profile →</Link>
                <Link href={`/breeding/${event._id}/edit`} className="text-sm text-blue-600 hover:underline">Edit Event →</Link>
              </div>
            )}
          </Card>
        </div>
      </PageWrapper>
    </>
  )
}
