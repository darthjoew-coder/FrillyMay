import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReceiptDoc extends Document {
  expenseId: mongoose.Types.ObjectId
  fileName: string
  mimeType: string
  fileSize: number
  fileData: Buffer
  uploadedAt: Date
}

const ReceiptSchema = new Schema<IReceiptDoc>(
  {
    expenseId: { type: Schema.Types.ObjectId, ref: 'Expense', required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileData: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

ReceiptSchema.index({ expenseId: 1 })

const Receipt: Model<IReceiptDoc> =
  mongoose.models.Receipt || mongoose.model<IReceiptDoc>('Receipt', ReceiptSchema)

export { Receipt }
