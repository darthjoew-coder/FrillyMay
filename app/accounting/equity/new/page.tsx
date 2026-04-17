import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import EquityForm from '@/components/accounting/EquityForm'

export default function NewEquityPage() {
  return (
    <>
      <TopBar title="Record Equity Transaction" subtitle="Owner Contribution or Draw" />
      <PageWrapper>
        <EquityForm />
      </PageWrapper>
    </>
  )
}
