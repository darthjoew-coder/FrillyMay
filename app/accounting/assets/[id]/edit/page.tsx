import { notFound } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import AssetForm from '@/components/accounting/AssetForm'
import { connectDB } from '@/lib/db'
import { FarmAsset } from '@/models/FarmAsset'

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const asset = await FarmAsset.findById(id).lean()
  if (!asset) notFound()

  const a = asset as unknown as Record<string, unknown>

  const initial = {
    _id: String(a._id),
    name: String(a.name || ''),
    description: String(a.description || ''),
    assetCategory: String(a.assetCategory || '') as never,
    placedInServiceDate: a.placedInServiceDate ? (a.placedInServiceDate as Date).toISOString().split('T')[0] : '',
    acquisitionCost: a.acquisitionCost as number,
    freightInstallation: a.freightInstallation as number,
    otherBasisCosts: a.otherBasisCosts as number,
    costBasis: a.costBasis as number,
    salvageValue: a.salvageValue as number,
    usefulLifeYears: a.usefulLifeYears as number,
    depreciationMethod: String(a.depreciationMethod || 'macrs') as never,
    section179Amount: a.section179Amount as number,
    bonusDepreciationPct: a.bonusDepreciationPct as number,
    status: String(a.status || 'active') as never,
    disposalDate: a.disposalDate ? (a.disposalDate as Date).toISOString().split('T')[0] : undefined,
    disposalAmount: a.disposalAmount as number | undefined,
    vendor: String(a.vendor || ''),
    serialNumber: String(a.serialNumber || ''),
    location: String(a.location || ''),
    notes: String(a.notes || ''),
    createdAt: String(a.createdAt || ''),
    updatedAt: String(a.updatedAt || ''),
  }

  return (
    <>
      <TopBar title="Edit Asset" subtitle={initial.name} />
      <PageWrapper>
        <AssetForm initial={initial} editId={id} />
      </PageWrapper>
    </>
  )
}
