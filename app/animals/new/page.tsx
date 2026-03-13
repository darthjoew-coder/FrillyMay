import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import AnimalForm from '@/components/animals/AnimalForm'

export default function NewAnimalPage() {
  return (
    <>
      <TopBar title="Add New Animal" subtitle="Register a new animal in the registry" />
      <PageWrapper>
        <AnimalForm />
      </PageWrapper>
    </>
  )
}
