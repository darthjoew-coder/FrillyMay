import mongoose, { Schema, Document, Model } from 'mongoose'

/**
 * AnimalPurchase – records the cost basis for a purchased animal.
 *
 * IRS RULE: The purchase cost of livestock bought for resale is NOT deductible
 * in the year of purchase. It is a DEFERRED cost that is only recognised on
 * Schedule F Line 1b in the year the animal is actually sold.
 *
 * Cost basis = purchasePrice + truckingCost + other acquisition costs.
 * Feed, vet, and care expenses are NEVER included here – those are deducted
 * in the year paid as ordinary Schedule F operating expenses.
 */
export interface IAnimalPurchaseDoc extends Document {
  animalId: mongoose.Types.ObjectId
  purchaseDate: Date
  purchasePrice: number       // price paid for the animal
  truckingCost: number        // hauling/delivery cost – included in cost basis
  otherCosts: number          // other acquisition costs included in cost basis
  costBasis: number           // computed total: purchasePrice + truckingCost + otherCosts
  sellerName?: string
  referenceNumber?: string    // check number, invoice, bill of sale reference
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AnimalPurchaseSchema = new Schema<IAnimalPurchaseDoc>(
  {
    animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true, unique: true },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    // Trucking / hauling cost is part of cost basis per IRS rules
    truckingCost: { type: Number, default: 0, min: 0 },
    otherCosts: { type: Number, default: 0, min: 0 },
    // Stored denormalised for quick Schedule F aggregation
    costBasis: { type: Number, required: true, min: 0 },
    sellerName: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

AnimalPurchaseSchema.index({ animalId: 1 })

const AnimalPurchase: Model<IAnimalPurchaseDoc> =
  mongoose.models.AnimalPurchase ||
  mongoose.model<IAnimalPurchaseDoc>('AnimalPurchase', AnimalPurchaseSchema)

export { AnimalPurchase }
