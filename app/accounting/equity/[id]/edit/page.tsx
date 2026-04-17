import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import EquityForm from '@/components/accounting/EquityForm'
import { connectDB } from '@/lib/db'
import { OwnerEquity } from '@/models/OwnerEquity'

export default async function EditEquityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()
  const record = await OwnerEquity.findById(id).lean() as any
  if (!record) notFound()

  const initial = {
    _id: String(record._id),
    type: record.type as 'contribution' | 'draw',
    amount: record.amount as number,
    date: (record.date as Date).toISOString(),
    taxYear: record.taxYear as number,
    description: record.description as string | undefined,
    paymentMethod: record.paymentMethod as string | undefined,
    referenceNumber: record.referenceNumber as string | undefined,
    notes: record.notes as string | undefined,
    createdAt: String(record.createdAt),
    updatedAt: String(record.updatedAt),
  }

  return (
    <>
      <TopBar
        title="Edit Equity Transaction"
        subtitle={`${initial.type === 'contribution' ? 'Owner Contribution' : 'Owner Draw'} — ${initial.taxYear}`}
      />
      <PageWrapper>
        <EquityForm initial={initial} editId={id} />
      </PageWrapper>
    </>
  )
}
