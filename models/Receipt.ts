import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILineItem {
  description: string
  amount?: number
  quantity?: number
  unitPrice?: number
}

export interface IReceiptDoc extends Document {
  // Discriminator: where this receipt came from
  source: 'web' | 'mobile'

  // Web receipts: linked to an Expense
  expenseId?: mongoose.Types.ObjectId

  // Mobile receipts: linked to a User
  userId?: mongoose.Types.ObjectId

  // Image storage (both web and mobile)
  imageData: Buffer
  imageMimeType: string
  imageSize: number
  fileName?: string          // web receipts have a filename
  thumbnailData?: Buffer     // mobile receipts have a thumbnail

  // Upload / extraction status (mobile)
  uploadStatus?: 'completed' | 'failed'
  extractionStatus?: 'processing' | 'completed' | 'failed' | 'skipped'
  status?: 'processing' | 'needs_review' | 'completed' | 'failed'

  // OCR-extracted fields (mobile)
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

  uploadedAt: Date
  createdAt: Date
  updatedAt: Date
}

const LineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, trim: true },
    amount: { type: Number },
    quantity: { type: Number },
    unitPrice: { type: Number },
  },
  { _id: false }
)

const ReceiptSchema = new Schema<IReceiptDoc>(
  {
    source: { type: String, enum: ['web', 'mobile'], default: 'web' },

    expenseId: { type: Schema.Types.ObjectId, ref: 'Expense' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },

    imageData: { type: Buffer, required: true },
    imageMimeType: { type: String, required: true },
    imageSize: { type: Number, required: true },
    fileName: { type: String },
    thumbnailData: { type: Buffer },

    uploadStatus: { type: String, enum: ['completed', 'failed'] },
    extractionStatus: { type: String, enum: ['processing', 'completed', 'failed', 'skipped'] },
    status: { type: String, enum: ['processing', 'needs_review', 'completed', 'failed'] },

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

    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

ReceiptSchema.index({ expenseId: 1 })
ReceiptSchema.index({ userId: 1, createdAt: -1 })
ReceiptSchema.index({ userId: 1, status: 1 })

const Receipt: Model<IReceiptDoc> =
  mongoose.models.Receipt || mongoose.model<IReceiptDoc>('Receipt', ReceiptSchema)

export { Receipt }
