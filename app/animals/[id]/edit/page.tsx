import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import AnimalForm from '@/components/animals/AnimalForm'
import { IAnimal } from '@/types'
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

export default async function EditAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const animal = await getAnimal(id)
  if (!animal) notFound()

  return (
    <>
      <TopBar title={`Edit: ${animal.tagId}`} subtitle={animal.name} />
      <PageWrapper>
        <AnimalForm initial={animal} editId={id} />
      </PageWrapper>
    </>
  )
}
