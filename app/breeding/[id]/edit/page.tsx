import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import BreedingForm from '@/components/breeding/BreedingForm'
import { IBreedingEvent } from '@/types'
import { connectDB } from '@/lib/db'
import { BreedingEvent } from '@/models/BreedingEvent'

async function getEvent(id: string): Promise<IBreedingEvent | null> {
  try {
    await connectDB()
    const doc = await BreedingEvent.findById(id)
      .populate('damId', 'tagId name _id')
      .populate('sireId', 'tagId name _id')
      .lean()
    if (!doc) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = doc as any
    const toStr = (d: unknown) => d instanceof Date ? d.toISOString() : (d ? String(d) : undefined)
    return {
      _id: String(e._id),
      damId: e.damId ? String(e.damId._id) : '',
      sireId: e.sireId ? String(e.sireId._id) : undefined,
      sireExternal: e.sireExternal,
      breedingDate: toStr(e.breedingDate) ?? '',
      method: e.method,
      species: e.species,
      expectedDueDate: toStr(e.expectedDueDate),
      gestationDays: e.gestationDays,
      status: e.status,
      confirmationDate: toStr(e.confirmationDate),
      confirmationMethod: e.confirmationMethod,
      actualDeliveryDate: toStr(e.actualDeliveryDate),
      offspringCount: e.offspringCount,
      offspringNotes: e.offspringNotes,
      notes: e.notes,
      dam: e.damId ? { _id: String(e.damId._id), tagId: e.damId.tagId, name: e.damId.name } : null,
      sire: e.sireId ? { _id: String(e.sireId._id), tagId: e.sireId.tagId, name: e.sireId.name } : null,
    } as IBreedingEvent
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
