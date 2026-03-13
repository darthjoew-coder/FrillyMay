'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import HealthLogForm from '@/components/health/HealthLogForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function NewHealthContent() {
  const searchParams = useSearchParams()
  const animalId = searchParams.get('animalId') || ''
  return (
    <>
      <TopBar title="Log Health Event" subtitle="Record a health treatment or observation" />
      <PageWrapper>
        <HealthLogForm preselectedAnimalId={animalId} />
      </PageWrapper>
    </>
  )
}

export default function NewHealthPage() {
  return <Suspense fallback={<LoadingSpinner />}><NewHealthContent /></Suspense>
}
