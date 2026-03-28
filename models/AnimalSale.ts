import mongoose, { Schema, Document, Model } from 'mongoose'
import type { AnimalClassification } from './Animal'

/**
 * AnimalSale – records the sale of an individual animal.
 *
 * Schedule F mapping (determined by the animal's classification at time of sale):
 *
 *   resale_inventory  → Line 1a (gross sale) + Line 1b (cost basis from AnimalPurchase)
 *   raised_for_sale   → Line 2  (full sale amount; no cost basis because raising
 *                        expenses were already deducted in the year paid)
 *   breeding_dairy /
 *   draft_work        → EXCLUDED from Schedule F livestock lines.
 *                        Must be reported on IRS Form 4797. Flagged accordingly.
 *   review_needed /
 *   other             → Not included in any Schedule F livestock total until
 *                        the user assigns a proper classification.
 */
export interface IAnimalSaleDoc extends Document {
  animalId: mongoose.Types.ObjectId
  saleDate: Date
  taxYear: number
  saleAmount: number           // gross sale price (Schedule F 1a or 2)
  /**
   * Cost basis copied from AnimalPurchase at time of sale.
   * Only populated for resale_inventory animals.
   * Used for Schedule F Line 1b.
   */
  costBasis: number
  /**
   * Classification of the animal at the time of sale – stored here so the
   * Schedule F report remains accurate even if the animal record is edited later.
   */
  classificationAtSale: AnimalClassification
  buyerName?: string
  saleType?: 'auction' | 'private' | 'other'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AnimalSaleSchema = new Schema<IAnimalSaleDoc>(
  {
    animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true, unique: true },
    saleDate: { type: Date, required: true },
    taxYear: { type: Number, required: true },
    saleAmount: { type: Number, required: true, min: 0 },
    // Denormalised from AnimalPurchase so Line 1b is always correct even if
    // the purchase record is later amended.
    costBasis: { type: Number, default: 0, min: 0 },
    classificationAtSale: {
      type: String,
      enum: ['resale_inventory', 'raised_for_sale', 'breeding_dairy', 'draft_work', 'other', 'review_needed'],
      required: true,
    },
    buyerName: { type: String, trim: true },
    saleType: { type: String, enum: ['auction', 'private', 'other'] },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

AnimalSaleSchema.index({ animalId: 1 })
AnimalSaleSchema.index({ taxYear: 1, classificationAtSale: 1 })

const AnimalSale: Model<IAnimalSaleDoc> =
  mongoose.models.AnimalSale ||
  mongoose.model<IAnimalSaleDoc>('AnimalSale', AnimalSaleSchema)

export { AnimalSale }
