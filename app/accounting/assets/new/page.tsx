import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import AssetForm from '@/components/accounting/AssetForm'

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const fromExpenseId = params.fromExpenseId || undefined

  const initial = {
    name: params.name || '',
    vendor: params.vendor || '',
    acquisitionCost: params.acquisitionCost ? Number(params.acquisitionCost) : undefined,
    placedInServiceDate: params.placedInServiceDate || '',
    notes: params.notes || '',
  }

  return (
    <>
      <TopBar
        title="Add Capital Asset"
        subtitle={fromExpenseId ? 'Converting from expense record' : 'Track a new depreciable farm asset'}
      />
      <PageWrapper>
        <AssetForm initial={initial} fromExpenseId={fromExpenseId} />
      </PageWrapper>
    </>
  )
}
