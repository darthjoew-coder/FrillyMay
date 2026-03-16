import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import CustomerForm from '@/components/customers/CustomerForm'

export default function NewCustomerPage() {
  return (
    <>
      <TopBar title="Add Customer" subtitle="Create a new customer record" />
      <PageWrapper>
        <CustomerForm />
      </PageWrapper>
    </>
  )
}
