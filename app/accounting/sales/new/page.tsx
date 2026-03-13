import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import SaleForm from '@/components/accounting/SaleForm'

export default function NewSalePage() {
  return (
    <>
      <TopBar title="Record Sale" subtitle="Log a new farm sale" />
      <PageWrapper><SaleForm /></PageWrapper>
    </>
  )
}
