import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import CustomerForm from '@/components/customers/CustomerForm'
import { ICustomer } from '@/types'
import { connectDB } from '@/lib/db'
import { Customer } from '@/models/Customer'

async function getCustomer(id: string): Promise<ICustomer | null> {
  try {
    await connectDB()
    const doc = await Customer.findById(id).lean()
    if (!doc) return null
    return JSON.parse(JSON.stringify(doc)) as ICustomer
  } catch {
    return null
  }
}

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await getCustomer(id)
  if (!customer) notFound()

  return (
    <>
      <TopBar title={`Edit: ${customer.displayName}`} />
      <PageWrapper>
        <CustomerForm initial={customer} editId={id} />
      </PageWrapper>
    </>
  )
}
