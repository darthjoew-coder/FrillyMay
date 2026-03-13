import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import BreedingForm from '@/components/breeding/BreedingForm'
import { IBreedingEvent } from '@/types'

async function getEvent(id: string): Promise<IBreedingEvent | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/breeding/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()).data
  } catch { return null }
}

export default async function EditBreedingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()
  return (
    <>
      <TopBar title="Edit Breeding Event" />
      <PageWrapper>
        <BreedingForm initial={event} editId={id} />
      </PageWrapper>
    </>
  )
}
