'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface DepreciationDeleteButtonProps {
  assetId: string
  taxYear: number
}

export default function DepreciationDeleteButton({ assetId, taxYear }: DepreciationDeleteButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/accounting/assets/${assetId}/depreciation?taxYear=${taxYear}`, { method: 'DELETE' })
    setLoading(false)
    setConfirming(false)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-700 font-medium">Delete {taxYear}?</span>
        <Button variant="danger" onClick={handleDelete} loading={loading}>Yes</Button>
        <Button variant="secondary" onClick={() => setConfirming(false)}>No</Button>
      </div>
    )
  }

  return (
    <Button variant="danger" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  )
}
