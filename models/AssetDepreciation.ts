import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * AssetDepreciation – stores the computed annual depreciation deduction for
 * each FarmAsset for each tax year.
 *
 * This record is what flows into the Schedule F / Form 4562 deduction for
 * "Depreciation and Section 179 expense" (Line 14d on Schedule F Part II).
 *
 * One record per asset per tax year.  Records are created/updated when the
 * user reviews the asset's depreciation schedule in the UI.
 *
 * MACRS half-year convention (the most common for farm property):
 *   Year 1 deduction = costBasis × (rate for year 1 from IRS table)
 *   Subsequent years use the appropriate MACRS table rate.
 *
 * §179 / Bonus depreciation:
 *   These are taken entirely in the year placed in service (taxYear = year 1).
 *   The remaining adjusted basis is depreciated normally in subsequent years.
 */
export interface IAssetDepreciationDoc extends Document {
  assetId: mongoose.Types.ObjectId
  taxYear: number
  depreciationAmount: number   // deduction for this tax year
  method: string               // macrs / straight_line / section_179 / bonus
  basisAtStartOfYear: number   // adjusted basis before this year's deduction
  accumulatedDepreciation: number // total depreciation taken through end of this year
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AssetDepreciationSchema = new Schema<IAssetDepreciationDoc>(
  {
    assetId: { type: Schema.Types.ObjectId, ref: 'FarmAsset', required: true },
    taxYear: { type: Number, required: true },
    depreciationAmount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
    basisAtStartOfYear: { type: Number, required: true, min: 0 },
    accumulatedDepreciation: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

// One depreciation record per asset per year
AssetDepreciationSchema.index({ assetId: 1, taxYear: 1 }, { unique: true })
AssetDepreciationSchema.index({ taxYear: 1 })

const AssetDepreciation: Model<IAssetDepreciationDoc> =
  mongoose.models.AssetDepreciation ||
  mongoose.model<IAssetDepreciationDoc>('AssetDepreciation', AssetDepreciationSchema)

export { AssetDepreciation }
