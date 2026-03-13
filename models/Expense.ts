import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExpenseDoc extends Document {
  date: Date
  vendor: string
  amount: number
  categoryId: mongoose.Types.ObjectId
  subcategory?: string
  paymentMethod: string
  description?: string
  notes?: string
  productLine: 'beef' | 'eggs' | 'general'
  taxYear: number
  status: 'draft' | 'finalized'
  createdBy?: string
}

const ExpenseSchema = new Schema<IExpenseDoc>(
  {
    date: { type: Date, required: true },
    vendor: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    subcategory: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'credit_card', 'debit_card', 'bank_transfer', 'other'],
      default: 'cash',
    },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    productLine: { type: String, enum: ['beef', 'eggs', 'general'], default: 'general' },
    taxYear: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'finalized'], default: 'draft' },
    createdBy: { type: String },
  },
  { timestamps: true }
)

ExpenseSchema.index({ date: -1 })
ExpenseSchema.index({ taxYear: 1, date: -1 })
ExpenseSchema.index({ categoryId: 1 })
ExpenseSchema.index({ productLine: 1 })
ExpenseSchema.index({ vendor: 1 })
ExpenseSchema.index({ taxYear: 1, categoryId: 1 })

const Expense: Model<IExpenseDoc> =
  mongoose.models.Expense || mongoose.model<IExpenseDoc>('Expense', ExpenseSchema)

export { Expense }
