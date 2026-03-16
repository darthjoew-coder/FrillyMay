import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICustomerDoc extends Document {
  firstName: string
  lastName: string
  businessName?: string
  displayName: string
  email?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zip?: string
  tags?: string[]
  notes?: string
  isActive: boolean
}

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    businessName: { type: String, trim: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    tags: [{ type: String, enum: ['retail', 'wholesale', 'restaurant', 'family', 'other'] }],
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

CustomerSchema.index({ isActive: 1 })
CustomerSchema.index({ lastName: 1, firstName: 1 })
CustomerSchema.index({ displayName: 1 })

const Customer: Model<ICustomerDoc> =
  mongoose.models.Customer || mongoose.model<ICustomerDoc>('Customer', CustomerSchema)

export { Customer }
