import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import SaleForm from '@/components/accounting/SaleForm'
import { connectDB } from '@/lib/db'
import Sale from '@/models/Sale'

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const sale = await Sale.findById(id).lean()
  if (!sale) notFound()

  const s = sale as Record<string, unknown>

  const initial = {
    _id: String(s._id),
    date: s.date ? String(s.date).split('T')[0] : '',
    productType: String(s.productType || '') as never,
    totalAmount: s.totalAmount as number,
    quantity: s.quantity as number | undefined,
    unit: String(s.unit || ''),
    unitPrice: s.unitPrice as number | undefined,
    customerName: String(s.customerName || ''),
    paymentMethod: String(s.paymentMethod || '') as never,
    referenceNumber: String(s.referenceNumber || ''),
    notes: String(s.notes || ''),
    taxYear: s.taxYear as number,
    createdAt: String(s.createdAt || ''),
    updatedAt: String(s.updatedAt || ''),
  }

  return (
    <>
      <TopBar title="Edit Sale" subtitle="Update sale record" />
      <PageWrapper>
        <SaleForm initial={initial} editId={id} />
      </PageWrapper>
    </>
  )
}
