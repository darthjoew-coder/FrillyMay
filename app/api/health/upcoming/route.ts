import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { HealthRecord } from '@/models/HealthRecord'
import { Animal } from '@/models/Animal'

export async function GET() {
  await connectDB()
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const records = await HealthRecord.find({
    isScheduled: true,
    scheduledDate: { $gte: now, $lte: in7Days },
  })
    .sort({ scheduledDate: 1 })
    .lean()

  const animalIds = [...new Set(records.map((r: any) => r.animalId?.toString()))]
  const animals = await Animal.find({ _id: { $in: animalIds } }).select('tagId name').lean()
  const animalMap = Object.fromEntries(animals.map((a: any) => [String(a._id), a]))

  const data = records.map((r: any) => ({
    _id: String(r._id),
    animalId: String(r.animalId),
    animal: animalMap[String(r.animalId)] ? {
      tagId: (animalMap[String(r.animalId)] as any).tagId,
      name: (animalMap[String(r.animalId)] as any).name,
    } : null,
    title: r.title,
    type: r.type,
    scheduledDate: r.scheduledDate?.toISOString(),
  }))

  return NextResponse.json({ data })
}
