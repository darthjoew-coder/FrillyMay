import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * FarmAsset – tracks capitalizable farm property for IRS Form 4562 / Schedule F.
 *
 * IRS RULES (Publication 225):
 * - Capital assets have a useful life > 1 year and must be depreciated over time.
 * - Cost basis = purchase price + freight + installation + other acquisition costs.
 * - DO NOT include routine maintenance costs in basis.
 * - Breeding/dairy/draft livestock go here (not Schedule F resale lines).
 * - Pre-productive costs for orchards/vineyards may be capitalised.
 *
 * MACRS depreciation lives (common farm assets, IRS Rev. Proc. 87-56):
 *   3 yr  – breeding hogs, racehorses
 *   5 yr  – automobiles, light trucks, computers, breeding cattle/sheep/goats
 *   7 yr  – most farm machinery & equipment, office furniture
 *   10 yr – trees/vines bearing fruit/nuts, barges, vessels
 *   15 yr – land improvements (fences, roads, drainage, water supply)
 *   20 yr – farm buildings (general-purpose)
 *   25 yr – water utility property
 *   27.5 yr – residential rental property (non-farm)
 *   39 yr – non-residential real property
 */

export type AssetCategory =
  | 'machinery_equipment'
  | 'building_structure'
  | 'land_improvement'
  | 'breeding_dairy_livestock'
  | 'orchard_vineyard'
  | 'vehicle'
  | 'other'

export type DepreciationMethod =
  | 'macrs'          // Modified Accelerated Cost Recovery System (default for most farm property)
  | 'straight_line'  // Straight-line (ADS or elected SL under MACRS)
  | 'section_179'    // Full expensing in year placed in service (IRS §179)
  | 'bonus'          // Bonus depreciation (§168(k)) – percentage in year placed in service
  | 'not_depreciable' // Land and other non-depreciable assets

export type AssetStatus = 'active' | 'disposed' | 'fully_depreciated'

export interface IFarmAssetDoc extends Document {
  name: string
  description?: string
  assetCategory: AssetCategory
  placedInServiceDate: Date   // date the asset was placed in service (starts depreciation clock)
  acquisitionCost: number     // purchase price
  freightInstallation: number // freight + installation – added to cost basis per IRS
  otherBasisCosts: number     // other capitalizable acquisition costs
  costBasis: number           // computed: acquisitionCost + freightInstallation + otherBasisCosts
  salvageValue: number        // estimated residual value (used for SL, often 0 for MACRS)
  usefulLifeYears: number     // IRS recovery period
  depreciationMethod: DepreciationMethod
  section179Amount: number    // §179 expensing taken in year placed in service (if any)
  bonusDepreciationPct: number // % of remaining basis taken as bonus depreciation
  status: AssetStatus
  disposalDate?: Date
  disposalAmount?: number     // proceeds received on sale/trade-in
  vendor?: string             // seller / dealer
  serialNumber?: string
  location?: string           // barn, field, etc.
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const FarmAssetSchema = new Schema<IFarmAssetDoc>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assetCategory: {
      type: String,
      required: true,
      enum: [
        'machinery_equipment', 'building_structure', 'land_improvement',
        'breeding_dairy_livestock', 'orchard_vineyard', 'vehicle', 'other',
      ],
    },
    placedInServiceDate: { type: Date, required: true },
    acquisitionCost: { type: Number, required: true, min: 0 },
    freightInstallation: { type: Number, default: 0, min: 0 },
    otherBasisCosts: { type: Number, default: 0, min: 0 },
    // Stored denormalised so reports don't need to recompute
    costBasis: { type: Number, required: true, min: 0 },
    salvageValue: { type: Number, default: 0, min: 0 },
    usefulLifeYears: { type: Number, required: true, min: 1 },
    depreciationMethod: {
      type: String,
      required: true,
      enum: ['macrs', 'straight_line', 'section_179', 'bonus', 'not_depreciable'],
      default: 'macrs',
    },
    // §179 deduction taken in year placed in service
    section179Amount: { type: Number, default: 0, min: 0 },
    // Bonus depreciation percentage (e.g. 100 for 100% first-year bonus)
    bonusDepreciationPct: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['active', 'disposed', 'fully_depreciated'],
      default: 'active',
    },
    disposalDate: { type: Date },
    disposalAmount: { type: Number, min: 0 },
    vendor: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

FarmAssetSchema.index({ status: 1 })
FarmAssetSchema.index({ assetCategory: 1 })
FarmAssetSchema.index({ placedInServiceDate: -1 })

const FarmAsset: Model<IFarmAssetDoc> =
  mongoose.models.FarmAsset ||
  mongoose.model<IFarmAssetDoc>('FarmAsset', FarmAssetSchema)

export { FarmAsset }
