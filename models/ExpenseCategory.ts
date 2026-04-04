import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IExpenseCategoryDoc extends Document {
  name: string
  type: 'expense' | 'income'
  scheduleFBucket: string
  active: boolean
  sortOrder: number
  capitalizable: boolean
}

const ExpenseCategorySchema = new Schema<IExpenseCategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    scheduleFBucket: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    capitalizable: { type: Boolean, default: false },
  },
  { timestamps: true }
)

ExpenseCategorySchema.index({ type: 1, active: 1, sortOrder: 1 })
ExpenseCategorySchema.index({ name: 1, type: 1 }, { unique: true })

const ExpenseCategory: Model<IExpenseCategoryDoc> =
  mongoose.models.ExpenseCategory ||
  mongoose.model<IExpenseCategoryDoc>('ExpenseCategory', ExpenseCategorySchema)

export { ExpenseCategory }
