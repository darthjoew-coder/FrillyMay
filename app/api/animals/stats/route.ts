import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Animal } from '@/models/Animal'
import { HealthRecord } from '@/models/HealthRecord'
import { BreedingEvent } from '@/models/BreedingEvent'
import { FeedingRecord } from '@/models/FeedingRecord'

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [
      totalAnimals,
      activeAnimals,
      speciesBreakdown,
      recentHealthEvents,
      upcomingTreatments,
      activePregnancies,
      feedingScheduleCount,
    ] = await Promise.all([
      Animal.countDocuments(),
      Animal.countDocuments({ status: 'active' }),
      Animal.aggregate([
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $project: { species: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),
      HealthRecord.find()
        .sort({ date: -1 })
        .limit(5)
        .populate('animalId', 'tagId name species')
        .lean(),
      HealthRecord.find({ nextDueDate: { $gte: now, $lte: thirtyDaysFromNow } })
        .sort({ nextDueDate: 1 })
        .limit(5)
        .populate('animalId', 'tagId name species')
        .lean(),
      BreedingEvent.find({ status: { $in: ['pending', 'confirmed_pregnant'] } })
        .sort({ expectedDueDate: 1 })
        .limit(5)
        .populate('damId', 'tagId name species')
        .lean(),
      FeedingRecord.countDocuments({ isScheduleTemplate: true }),
    ])

    return NextResponse.json({
      data: {
        totalAnimals,
        activeAnimals,
        speciesBreakdown,
        recentHealthEvents: recentHealthEvents.map(r => ({
          ...r,
          animal: r.animalId,
        })),
        upcomingTreatments: upcomingTreatments.map(r => ({
          ...r,
          animal: r.animalId,
        })),
        activePregnancies: activePregnancies.map(b => ({
          ...b,
          dam: b.damId,
        })),
        feedingScheduleCount,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
