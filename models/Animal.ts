import mongoose, { Schema } from 'mongoose'

/**
 * IRS Schedule F livestock classification.
 *
 * resale_inventory  – Purchased market animals held for resale.
 *                     Cost basis is DEFERRED until sold (Schedule F Line 1a/1b).
 * raised_for_sale   – Animals born on the farm and raised for market.
 *                     No cost basis; full sale price flows to Schedule F Line 2.
 * breeding_dairy    – Breeding cows, bulls, dairy cows, etc.
 *                     Capital/business-use animals – excluded from Schedule F
 *                     livestock lines; flag for Form 4797.
 * draft_work        – Draft horses, mules, working animals.
 *                     Same Form 4797 treatment as breeding_dairy.
 * other             – Does not fit a standard category.
 * review_needed     – Default for existing animals; must be reviewed before
 *                     tax reporting. Will not appear on any Schedule F lines.
 */
export type AnimalClassification =
  | 'resale_inventory'
  | 'raised_for_sale'
  | 'breeding_dairy'
  | 'draft_work'
  | 'other'
  | 'review_needed'

export type AcquisitionMethod =
  | 'purchased'
  | 'born_on_farm'
  | 'transferred'
  | 'other'

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

    /** How the animal came to the farm – drives default Schedule F treatment */
    acquisitionMethod: {
      type: String,
      enum: ['purchased', 'born_on_farm', 'transferred', 'other'],
      default: 'other',
    },

    /**
     * IRS Schedule F / tax classification.
     * Defaults to 'review_needed' so existing records require explicit user
     * review rather than being silently mis-classified.
     */
    classification: {
      type: String,
      enum: ['resale_inventory', 'raised_for_sale', 'breeding_dairy', 'draft_work', 'other', 'review_needed'],
      default: 'review_needed',
    },

    /** Free-text description of intended use (e.g. "market steer", "show heifer") */
    intendedUse: { type: String, trim: true },

    currentWeight: { type: Number },
    status: {
      type: String,
      required: true,
      enum: ['active', 'sold', 'deceased', 'butchered', 'culled'],
      default: 'active',
    },
    statusDate: { type: Date },
    statusNotes: { type: String },
    location: { type: String },
    color: { type: String },
    notes: { type: String },
    damName: { type: String, trim: true },
    sireName: { type: String, trim: true },
  },
  { timestamps: true }
)

AnimalSchema.index({ species: 1 })
AnimalSchema.index({ status: 1 })
AnimalSchema.index({ classification: 1 })
AnimalSchema.index({ acquisitionMethod: 1 })

export const Animal = mongoose.models.Animal || mongoose.model('Animal', AnimalSchema)
