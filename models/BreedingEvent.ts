import mongoose, { Schema } from 'mongoose'

const BreedingEventSchema = new Schema(
  {
    damId: { type: Schema.Types.ObjectId, ref: 'Animal', required: true },
    sireId: { type: Schema.Types.ObjectId, ref: 'Animal' },
    sireExternal: { type: String },
    breedingDate: { type: Date, required: true },
    method: {
      type: String,
      enum: ['natural', 'ai', 'embryo_transfer', 'unknown'],
      default: 'natural',
    },
    species: { type: String, required: true },
    expectedDueDate: { type: Date },
    gestationDays: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'confirmed_pregnant', 'not_pregnant', 'delivered', 'lost'],
      default: 'pending',
    },
    confirmationDate: { type: Date },
    confirmationMethod: { type: String },
    actualDeliveryDate: { type: Date },
    offspringCount: { type: Number },
    offspringIds: [{ type: Schema.Types.ObjectId, ref: 'Animal' }],
    offspringNotes: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

BreedingEventSchema.index({ damId: 1 })
BreedingEventSchema.index({ status: 1 })
BreedingEventSchema.index({ expectedDueDate: 1 })

export const BreedingEvent = mongoose.models.BreedingEvent || mongoose.model('BreedingEvent', BreedingEventSchema)
