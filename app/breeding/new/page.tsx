import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import BreedingForm from '@/components/breeding/BreedingForm'

export default function NewBreedingPage() {
  return (
    <>
      <TopBar title="Record Breeding Event" subtitle="Log a new breeding event and track pregnancy" />
      <PageWrapper>
        <BreedingForm />
      </PageWrapper>
    </>
  )
}
