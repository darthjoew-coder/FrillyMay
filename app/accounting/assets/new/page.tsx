import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import AssetForm from '@/components/accounting/AssetForm'

export default function NewAssetPage() {
  return (
    <>
      <TopBar title="Add Capital Asset" subtitle="Track a new depreciable farm asset" />
      <PageWrapper>
        <AssetForm />
      </PageWrapper>
    </>
  )
}
