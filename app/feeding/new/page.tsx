'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import FeedingForm from '@/components/feeding/FeedingForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

function NewFeedingContent() {
  const searchParams = useSearchParams()
  const animalId = searchParams.get('animalId') || ''
  return (
    <>
      <TopBar title="Add Feeding Record" subtitle="Log a feeding event or create a schedule" />
      <PageWrapper>
        <FeedingForm initial={animalId ? { animalId } : undefined} />
      </PageWrapper>
    </>
  )
}

export default function NewFeedingPage() {
  return <Suspense fallback={<LoadingSpinner />}><NewFeedingContent /></Suspense>
}
