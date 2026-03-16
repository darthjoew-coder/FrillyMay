import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISaleDoc extends Document {
  date: Date
  productType: 'beef' | 'eggs' | 'other'
  quantity?: number
  unit?: string
  unitPrice?: number
  totalAmount: number
  customerId?: mongoose.Types.ObjectId
  customerName?: string
  paymentMethod: string
  referenceNumber?: string
  notes?: string
  taxYear: number
  createdBy?: string
}

const SaleSchema = new Schema<ISaleDoc>(
  {
    date: { type: Date, required: true },
    productType: { type: String, enum: ['beef', 'eggs', 'other'], required: true },
    quantity: { type: Number, min: 0 },
    unit: { type: String, trim: true },
    unitPrice: { type: Number, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
      default: 'cash',
    },
    referenceNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    taxYear: { type: Number, required: true },
    createdBy: { type: String },
  },
  { timestamps: true }
)

SaleSchema.index({ date: -1 })
SaleSchema.index({ taxYear: 1, date: -1 })
SaleSchema.index({ productType: 1 })
SaleSchema.index({ taxYear: 1, productType: 1 })
SaleSchema.index({ customerId: 1 })
SaleSchema.index({ customerId: 1, taxYear: 1, date: -1 })

const Sale: Model<ISaleDoc> =
  mongoose.models.Sale || mongoose.model<ISaleDoc>('Sale', SaleSchema)

export { Sale }
