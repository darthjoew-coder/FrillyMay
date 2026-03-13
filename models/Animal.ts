import mongoose, { Schema } from 'mongoose'

const AnimalSchema = new Schema(
  {
    tagId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    species: {
      type: String,
      required: true,
      enum: ['cattle', 'pig', 'sheep', 'goat', 'chicken', 'duck', 'turkey', 'rabbit', 'horse', 'alpaca', 'other'],
    },
    breed: { type: String, trim: true },
    sex: { type: String, required: true, enum: ['male', 'female', 'unknown'] },
    dateOfBirth: { type: Date },
    acquisitionDate: { type: Date },
    acquisitionSource: { type: String },
    currentWeight: { type: Number },
    status: {
      type: String,
      required: true,
      enum: ['active', 'sold', 'deceased'],
      default: 'active',
    },
    statusDate: { type: Date },
    statusNotes: { type: String },
    location: { type: String },
    color: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
)

AnimalSchema.index({ species: 1 })
AnimalSchema.index({ status: 1 })

export const Animal = mongoose.models.Animal || mongoose.model('Animal', AnimalSchema)
