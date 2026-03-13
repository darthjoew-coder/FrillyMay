import mongoose, { Schema } from 'mongoose'

const FeedingRecordSchema = new Schema(
  {
    animalId: { type: Schema.Types.ObjectId, ref: 'Animal' },
    groupName: { type: String },
    date: { type: Date, required: true, default: Date.now },
    feedType: {
      type: String,
      required: true,
      enum: ['hay', 'grain', 'pellets', 'silage', 'pasture', 'supplement', 'mineral', 'scratch', 'mash', 'mixed', 'other'],
    },
    feedBrand: { type: String },
    quantity: { type: Number },
    unit: {
      type: String,
      enum: ['kg', 'lbs', 'flakes', 'scoops', 'cups', 'bales', 'liters'],
    },
    feedingTime: {
      type: String,
      enum: ['morning', 'midday', 'evening', 'free_choice', 'other'],
    },
    waterAccess: {
      type: String,
      enum: ['fresh_provided', 'trough_checked', 'automatic', 'limited', 'none'],
    },
    waterNotes: { type: String },
    isScheduleTemplate: { type: Boolean, default: false },
    scheduleFrequency: {
      type: String,
      enum: ['daily', 'twice_daily', 'weekly', 'as_needed'],
    },
    cost: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
)

FeedingRecordSchema.index({ animalId: 1 })
FeedingRecordSchema.index({ date: -1 })
FeedingRecordSchema.index({ isScheduleTemplate: 1 })

export const FeedingRecord = mongoose.models.FeedingRecord || mongoose.model('FeedingRecord', FeedingRecordSchema)
