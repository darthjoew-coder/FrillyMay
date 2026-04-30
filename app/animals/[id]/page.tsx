import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import AnimalStatusBadge from '@/components/animals/AnimalStatusBadge'
import Button from '@/components/ui/Button'
import { IAnimal, IAnimalPurchase, IAnimalSale } from '@/types'
import { calculateAge, formatDate } from '@/lib/utils'
import { SPECIES_EMOJI, ANIMAL_CLASSIFICATIONS } from '@/lib/constants'
import { connectDB } from '@/lib/db'
import { Animal } from '@/models/Animal'
import { AnimalPurchase } from '@/models/AnimalPurchase'
import { AnimalSale } from '@/models/AnimalSale'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

function ClassificationBadge({ classification }: { classification: string }) {
  const info = ANIMAL_CLASSIFICATIONS.find(c => c.value === classification)
  const colors: Record<string, string> = {
    resale_inventory: 'bg-orange-100 text-orange-800 border-orange-200',
    raised_for_sale: 'bg-green-100 text-green-800 border-green-200',
    breeding_dairy: 'bg-blue-100 text-blue-800 border-blue-200',
    draft_work: 'bg-purple-100 text-purple-800 border-purple-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
    review_needed: 'bg-amber-100 text-amber-800 border-amber-200',
  }
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${colors[classification] || colors.other}`}>
      {info?.label || classification}
    </span>
  )
}

export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const [rawAnimal, rawPurchase, rawSale] = await Promise.all([
    Animal.findById(id).lean(),
    AnimalPurchase.findOne({ animalId: id }).lean(),
    AnimalSale.findOne({ animalId: id }).lean(),
  ])

  if (!rawAnimal) notFound()

  const animal = rawAnimal as unknown as IAnimal
  const purchase = rawPurchase as unknown as IAnimalPurchase | null
  const sale = rawSale as unknown as IAnimalSale | null

  const isSold = animal.status === 'sold'
  const isResale = animal.classification === 'resale_inventory'
  const isRaised = animal.classification === 'raised_for_sale'
  const isForm4797 = animal.classification === 'breeding_dairy' || animal.classification === 'draft_work'
  const needsReview = animal.classification === 'review_needed'

  const fields = [
    { label: 'Tag ID', value: animal.tagId },
    { label: 'Name', value: animal.name || '—' },
    { label: 'Species', value: `${SPECIES_EMOJI[animal.species] || ''} ${animal.species}` },
    { label: 'Breed', value: animal.breed || '—' },
    { label: 'Sex', value: animal.sex },
    { label: 'Date of Birth', value: animal.dateOfBirth ? formatDate(animal.dateOfBirth, 'long') : '—' },
    { label: 'Age', value: animal.dateOfBirth ? calculateAge(animal.dateOfBirth) : '—' },
    { label: 'Weight', value: animal.currentWeight ? `${animal.currentWeight} kg` : '—' },
    { label: 'Location', value: animal.location || '—' },
    { label: 'Color', value: animal.color || '—' },
    { label: 'How Acquired', value: animal.acquisitionMethod ? animal.acquisitionMethod.replace(/_/g, ' ') : '—' },
    { label: 'Acquisition Date', value: animal.acquisitionDate ? formatDate(animal.acquisitionDate) : '—' },
    { label: 'Acquisition Source', value: animal.acquisitionSource || '—' },
    { label: 'Intended Use', value: animal.intendedUse || '—' },
    { label: 'Dam (Mother)', value: animal.damName || '—' },
    { label: 'Sire (Father)', value: animal.sireName || '—' },
    { label: 'Added', value: formatDate(animal.createdAt) },
  ]

  return (
    <>
      <TopBar
        title={animal.name ? `${animal.tagId} — ${animal.name}` : animal.tagId}
        subtitle={`${SPECIES_EMOJI[animal.species] || ''} ${animal.species} · ${animal.breed || 'Unknown breed'}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/health/new?animalId=${animal._id}`}>
              <Button variant="secondary" size="sm">+ Health Record</Button>
            </Link>
            <Link href={`/feeding/new?animalId=${animal._id}`}>
              <Button variant="secondary" size="sm">+ Feeding</Button>
            </Link>
            {!isSold && (
              <Link href={`/animals/${animal._id}/sell`}>
                <Button variant="secondary" size="sm">Record Sale</Button>
              </Link>
            )}
            <Link href={`/animals/${animal._id}/edit`}>
              <Button size="sm">Edit</Button>
            </Link>
          </div>
        }
      />
      <PageWrapper>
        <div className="max-w-3xl space-y-6">
          {/* Review needed warning */}
          {needsReview && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">Classification Review Needed</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This animal has no IRS Schedule F classification. It will not appear on any tax report lines until classified.{' '}
                <Link href={`/animals/${animal._id}/edit`} className="underline font-medium">Edit animal to classify.</Link>
              </p>
            </div>
          )}

          {/* Profile */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Animal Profile</h2>
              <div className="flex items-center gap-2">
                <ClassificationBadge classification={animal.classification || 'review_needed'} />
                <AnimalStatusBadge status={animal.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {fields.map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-500">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800 capitalize">{f.value}</p>
                </div>
              ))}
            </div>
            {animal.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{animal.notes}</p>
              </div>
            )}
          </Card>

          {/* Schedule F / Tax accounting card */}
          <Card>
            <h2 className="text-base font-semibold text-gray-800 mb-4">Schedule F / Tax Accounting</h2>
            <div className="space-y-3">
              {isResale && (
                <>
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div>
                      <p className="text-xs font-semibold text-orange-800">Purchased for Resale — Schedule F Line 1</p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        Cost basis is deferred. Gross sale will appear on Line 1a; cost basis on Line 1b in the year sold.
                      </p>
                    </div>
                  </div>
                  {purchase ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm pt-1">
                      <div><p className="text-xs text-gray-500">Purchase Date</p><p className="font-medium">{formatDate(purchase.purchaseDate)}</p></div>
                      <div><p className="text-xs text-gray-500">Purchase Price</p><p className="font-medium">{fmt(purchase.purchasePrice)}</p></div>
                      <div><p className="text-xs text-gray-500">Trucking Cost</p><p className="font-medium">{fmt(purchase.truckingCost)}</p></div>
                      <div><p className="text-xs text-gray-500">Other Costs</p><p className="font-medium">{fmt(purchase.otherCosts)}</p></div>
                      <div><p className="text-xs text-gray-500">Seller</p><p className="font-medium">{purchase.sellerName || '—'}</p></div>
                      <div>
                        <p className="text-xs text-gray-500">Cost Basis (Deferred)</p>
                        <p className="font-semibold text-orange-800">{fmt(purchase.costBasis)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      No purchase record found.{' '}
                      <Link href={`/animals/${animal._id}/edit`} className="underline">Edit animal</Link> to add purchase details.
                    </p>
                  )}
                </>
              )}

              {isRaised && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold text-green-800">Raised for Sale — Schedule F Line 2</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Full sale price will be reported on Line 2. No cost basis — raising expenses were deducted in the year paid.
                  </p>
                </div>
              )}

              {isForm4797 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800">
                    {animal.classification === 'breeding_dairy' ? 'Breeding / Dairy Animal' : 'Draft / Work Animal'} — Excluded from Schedule F
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Capital/business-use animals are not reported on Schedule F livestock lines. Sale must be reported on IRS Form 4797.
                    Consult your tax advisor.
                  </p>
                </div>
              )}

              {/* Sale record */}
              {sale && (
                <div className="border-t border-gray-100 pt-3 mt-2">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Sale Record</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div><p className="text-xs text-gray-500">Sale Date</p><p className="font-medium">{formatDate(sale.saleDate)}</p></div>
                    <div><p className="text-xs text-gray-500">Tax Year</p><p className="font-medium">{sale.taxYear}</p></div>
                    <div><p className="text-xs text-gray-500">Sale Amount</p><p className="font-semibold text-green-700">{fmt(sale.saleAmount)}</p></div>
                    {isResale && <div><p className="text-xs text-gray-500">Cost Basis (Line 1b)</p><p className="font-semibold text-orange-700">{fmt(sale.costBasis)}</p></div>}
                    {isResale && <div><p className="text-xs text-gray-500">Net (Line 1)</p><p className="font-semibold">{fmt(sale.saleAmount - sale.costBasis)}</p></div>}
                    <div><p className="text-xs text-gray-500">Buyer</p><p className="font-medium">{sale.buyerName || '—'}</p></div>
                    <div><p className="text-xs text-gray-500">Sale Type</p><p className="font-medium capitalize">{sale.saleType || '—'}</p></div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-4">
            <Link href={`/health?animalId=${animal._id}`} className="block">
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">🩺</div>
                <p className="font-semibold text-gray-800">Health Records</p>
                <p className="text-xs text-gray-500 mt-0.5">View all health events</p>
              </Card>
            </Link>
            <Link href={`/feeding?animalId=${animal._id}`} className="block">
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">🌾</div>
                <p className="font-semibold text-gray-800">Feeding Records</p>
                <p className="text-xs text-gray-500 mt-0.5">View feeding history</p>
              </Card>
            </Link>
            <Link href={`/breeding?damId=${animal._id}`} className="block">
              <Card className="hover:border-green-300 transition-colors cursor-pointer">
                <div className="text-2xl mb-2">🐣</div>
                <p className="font-semibold text-gray-800">Breeding Events</p>
                <p className="text-xs text-gray-500 mt-0.5">View breeding history</p>
              </Card>
            </Link>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
