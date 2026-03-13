import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import AnimalStatusBadge from '@/components/animals/AnimalStatusBadge'
import Button from '@/components/ui/Button'
import { IAnimal } from '@/types'
import { calculateAge, formatDate } from '@/lib/utils'
import { SPECIES_EMOJI } from '@/lib/constants'
import { connectDB } from '@/lib/db'
import { Animal } from '@/models/Animal'

async function getAnimal(id: string): Promise<IAnimal | null> {
  try {
    await connectDB()
    const animal = await Animal.findById(id).lean()
    if (!animal) return null
    return animal as unknown as IAnimal
  } catch {
    return null
  }
}

export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const animal = await getAnimal(id)
  if (!animal) notFound()

  const fields = [
    { label: 'Tag ID', value: animal.tagId },
    { label: 'Name', value: animal.name || '—' },
    { label: 'Species', value: `${SPECIES_EMOJI[animal.species] || ''} ${animal.species}` },
    { label: 'Breed', value: animal.breed || '—' },
    { label: 'Sex', value: animal.sex },
    { label: 'Date of Birth', value: animal.dateOfBirth ? formatDate(animal.dateOfBirth, 'long') : '—' },
    { label: 'Age', value: animal.dateOfBirth ? calculateAge(animal.dateOfBirth) : '—' },
    { label: 'Weight', value: animal.currentWeight ? `${animal.currentWeight} kg` : '—' },
    { label: 'Location', value: animal.location || '—' },
    { label: 'Color', value: animal.color || '—' },
    { label: 'Acquisition Date', value: animal.acquisitionDate ? formatDate(animal.acquisitionDate) : '—' },
    { label: 'Acquisition Source', value: animal.acquisitionSource || '—' },
    { label: 'Added', value: formatDate(animal.createdAt) },
  ]

  return (
    <>
      <TopBar
        title={animal.name ? `${animal.tagId} — ${animal.name}` : animal.tagId}
        subtitle={`${SPECIES_EMOJI[animal.species] || ''} ${animal.species} · ${animal.breed || 'Unknown breed'}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/health/new?animalId=${animal._id}`}>
              <Button variant="secondary" size="sm">+ Health Record</Button>
            </Link>
            <Link href={`/feeding/new?animalId=${animal._id}`}>
              <Button variant="secondary" size="sm">+ Feeding</Button>
            </Link>
            <Link href={`/animals/${animal._id}/edit`}>
              <Button size="sm">Edit</Button>
            </Link>
          </div>
        }
      />
      <PageWrapper>
        <div className="max-w-3xl space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Animal Profile</h2>
              <AnimalStatusBadge status={animal.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {fields.map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-500">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{f.value}</p>
                </div>
              ))}
            </div>
            {animal.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{animal.notes}</p>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Link href={`/health?animalId=${animal._id}`} className="block">
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">🩺</div>
                <p className="font-semibold text-gray-800">Health Records</p>
                <p className="text-xs text-gray-500 mt-0.5">View all health events</p>
              </Card>
            </Link>
            <Link href={`/feeding?animalId=${animal._id}`} className="block">
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">🌾</div>
                <p className="font-semibold text-gray-800">Feeding Records</p>
                <p className="text-xs text-gray-500 mt-0.5">View feeding history</p>
              </Card>
            </Link>
            <Link href={`/breeding?damId=${animal._id}`} className="block">
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">🐣</div>
                <p className="font-semibold text-gray-800">Breeding Events</p>
                <p className="text-xs text-gray-500 mt-0.5">View breeding history</p>
              </Card>
            </Link>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
