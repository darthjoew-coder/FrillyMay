import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMobileSessionDoc extends Document {
  token: string
  userId: mongoose.Types.ObjectId
  email: string
  expiresAt: Date
}

const MobileSessionSchema = new Schema<IMobileSessionDoc>({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  expiresAt: { type: Date, required: true },
})

// TTL index: MongoDB auto-deletes expired sessions
MobileSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
MobileSessionSchema.index({ token: 1 })

const MobileSession: Model<IMobileSessionDoc> =
  mongoose.models.MobileSession || mongoose.model<IMobileSessionDoc>('MobileSession', MobileSessionSchema)

export { MobileSession }
