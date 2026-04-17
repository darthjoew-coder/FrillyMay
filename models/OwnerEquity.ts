import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOwnerEquityDoc extends Document {
  type: 'contribution' | 'draw'
  amount: number
  date: Date
  taxYear: number
  description?: string
  paymentMethod?: string
  referenceNumber?: string
  notes?: string
}

const OwnerEquitySchema = new Schema<IOwnerEquityDoc>(
  {
    type: { type: String, enum: ['contribution', 'draw'], required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    taxYear: { type: Number, required: true },
    description: { type: String, trim: true },
    paymentMethod: { type: String },
    referenceNumber: { type: String, trim: true },
    notes: { type: String },
  },
  { timestamps: true }
)

OwnerEquitySchema.index({ taxYear: 1, type: 1 })
OwnerEquitySchema.index({ date: -1 })

const OwnerEquity: Model<IOwnerEquityDoc> =
  mongoose.models.OwnerEquity ||
  mongoose.model<IOwnerEquityDoc>('OwnerEquity', OwnerEquitySchema)

export { OwnerEquity }
