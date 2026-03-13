import mongoose, { Schema } from 'mongoose'

const HealthRecordSchema = new Schema(
  {
    animalId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
    date: { type: Date, required: true, default: Date.now },
    type: {
      type: String,
      required: true,
      enum: ['vaccination', 'medication', 'vet_visit', 'injury', 'illness', 'deworming', 'weight_check', 'hoof_care', 'other'],
    },
    title: { type: String, required: true },
    description: { type: String },
    medication: { type: String },
    dosage: { type: String },
    administeredBy: { type: String },
    cost: { type: Number },
    nextDueDate: { type: Date },
    weight: { type: Number },
    temperature: { type: Number },
    notes: { type: String },
  },
  { timestamps: true }
)

HealthRecordSchema.index({ animalId: 1 })
HealthRecordSchema.index({ date: -1 })
HealthRecordSchema.index({ nextDueDate: 1 })

export const HealthRecord = mongoose.models.HealthRecord || mongoose.model('HealthRecord', HealthRecordSchema)
