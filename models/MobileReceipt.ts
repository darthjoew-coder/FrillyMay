import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILineItem {
  description: string
  amount?: number
  quantity?: number
  unitPrice?: number
}

export interface IMobileReceiptDoc extends Document {
  userId: mongoose.Types.ObjectId
  imageData: Buffer
  imageMimeType: string
  imageSize: number
  thumbnailData?: Buffer
  uploadStatus: 'completed' | 'failed'
  extractionStatus: 'processing' | 'completed' | 'failed' | 'skipped'
  status: 'processing' | 'needs_review' | 'completed' | 'failed'
  merchantName?: string
  receiptDate?: Date
  totalAmount?: number
  subtotalAmount?: number
  taxAmount?: number
  category?: string
  notes?: string
  paymentMethod?: string
  lineItems?: ILineItem[]
  rawApiResponse?: Record<string, unknown>
  extractedText?: string
}

const LineItemSchema = new Schema<ILineItem>({
  description: { type: String, trim: true },
  amount: { type: Number },
  quantity: { type: Number },
  unitPrice: { type: Number },
}, { _id: false })

const MobileReceiptSchema = new Schema<IMobileReceiptDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imageData: { type: Buffer, required: true },
    imageMimeType: { type: String, required: true },
    imageSize: { type: Number, required: true },
    thumbnailData: { type: Buffer },
    uploadStatus: { type: String, enum: ['completed', 'failed'], default: 'completed' },
    extractionStatus: {
      type: String,
      enum: ['processing', 'completed', 'failed', 'skipped'],
      default: 'processing',
    },
    status: {
      type: String,
      enum: ['processing', 'needs_review', 'completed', 'failed'],
      default: 'processing',
    },
    merchantName: { type: String, trim: true },
    receiptDate: { type: Date },
    totalAmount: { type: Number },
    subtotalAmount: { type: Number },
    taxAmount: { type: Number },
    category: { type: String, trim: true },
    notes: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    lineItems: [LineItemSchema],
    rawApiResponse: { type: Schema.Types.Mixed },
    extractedText: { type: String },
  },
  { timestamps: true }
)

MobileReceiptSchema.index({ userId: 1, createdAt: -1 })
MobileReceiptSchema.index({ userId: 1, status: 1 })

const MobileReceipt: Model<IMobileReceiptDoc> =
  mongoose.models.MobileReceipt || mongoose.model<IMobileReceiptDoc>('MobileReceipt', MobileReceiptSchema)

export { MobileReceipt }
