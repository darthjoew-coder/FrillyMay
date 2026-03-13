import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { IDashboardStats } from '@/types'
import { formatDate, getDaysUntil } from '@/lib/utils'
import { SPECIES_EMOJI } from '@/lib/constants'
import { connectDB } from '@/lib/db'
import { Animal } from '@/models/Animal'
import { HealthRecord } from '@/models/HealthRecord'
import { BreedingEvent } from '@/models/BreedingEvent'
import { FeedingRecord } from '@/models/FeedingRecord'

async function getStats(): Promise<IDashboardStats | null> {
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
      HealthRecord.find().sort({ date: -1 }).limit(5).populate('animalId', 'tagId name species').lean(),
      HealthRecord.find({ nextDueDate: { $gte: now, $lte: thirtyDaysFromNow } })
        .sort({ nextDueDate: 1 }).limit(5).populate('animalId', 'tagId name species').lean(),
      BreedingEvent.find({ status: { $in: ['pending', 'confirmed_pregnant'] } })
        .sort({ expectedDueDate: 1 }).limit(5).populate('damId', 'tagId name species').lean(),
      FeedingRecord.countDocuments({ isScheduleTemplate: true }),
    ])

    return {
      totalAnimals,
      activeAnimals,
      speciesBreakdown,
      recentHealthEvents: recentHealthEvents.map((r: any) => ({ ...r, animal: r.animalId })),
      upcomingTreatments: upcomingTreatments.map((r: any) => ({ ...r, animal: r.animalId })),
      activePregnancies: activePregnancies.map((b: any) => ({ ...b, dam: b.damId })),
      feedingScheduleCount,
    }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <TopBar title="Dashboard" subtitle={today} />
      <PageWrapper>
        {!stats ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Could not connect to database. Check your MongoDB connection in .env.local
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard icon="🐾" label="Total Animals" value={stats.totalAnimals} href="/animals" color="green" />
              <StatCard icon="✅" label="Active Animals" value={stats.activeAnimals} href="/animals?status=active" color="blue" />
              <StatCard icon="🩺" label="Health Alerts" value={stats.upcomingTreatments.length} href="/health?upcoming=true" color="yellow" />
              <StatCard icon="🤰" label="Active Pregnancies" value={stats.activePregnancies.length} href="/breeding?status=confirmed_pregnant" color="purple" />
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Recent Health Events */}
              <Card padding="none">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Recent Health Events</h3>
                  <Link href="/health" className="text-xs text-green-700 hover:underline">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats.recentHealthEvents.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">No health records yet</p>
                  ) : stats.recentHealthEvents.map((r) => (
                    <Link key={r._id} href={`/health/${r._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.title}</p>
                        <p className="text-xs text-gray-500">
                          {r.animal ? r.animal.tagId : '—'} · {formatDate(r.date)}
                        </p>
                      </div>
                      <Badge variant="blue">{r.type.replace(/_/g, ' ')}</Badge>
                    </Link>
                  ))}
                </div>
              </Card>

              {/* Upcoming Due Dates */}
              <Card padding="none">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Upcoming Treatments</h3>
                  <Link href="/health" className="text-xs text-green-700 hover:underline">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats.upcomingTreatments.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">No upcoming treatments</p>
                  ) : stats.upcomingTreatments.map((r) => {
                    const days = r.nextDueDate ? getDaysUntil(r.nextDueDate) : null
                    return (
                      <Link key={r._id} href={`/health/${r._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{r.title}</p>
                          <p className="text-xs text-gray-500">{r.animal ? r.animal.tagId : '—'}</p>
                        </div>
                        {days !== null && (
                          <span className={`text-xs font-semibold ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {days === 0 ? 'Today' : `In ${days}d`}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Species Breakdown */}
              <Card>
                <h3 className="font-semibold text-gray-800 mb-4">Herd Breakdown</h3>
                {stats.speciesBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No animals registered</p>
                ) : (
                  <div className="space-y-3">
                    {stats.speciesBreakdown.map(({ species, count }) => {
                      const pct = stats.totalAnimals > 0 ? Math.round((count / stats.totalAnimals) * 100) : 0
                      return (
                        <div key={species}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 flex items-center gap-1.5">
                              {SPECIES_EMOJI[species] || '🐾'} {species.charAt(0).toUpperCase() + species.slice(1)}
                            </span>
                            <span className="text-sm font-semibold text-gray-800">{count}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>

              {/* Active Pregnancies */}
              <Card padding="none">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Active Pregnancies</h3>
                  <Link href="/breeding" className="text-xs text-green-700 hover:underline">View all →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {stats.activePregnancies.length === 0 ? (
                    <p className="px-5 py-6 text-sm text-gray-400 text-center">No active pregnancies</p>
                  ) : stats.activePregnancies.map((b) => {
                    const days = b.expectedDueDate ? getDaysUntil(b.expectedDueDate) : null
                    return (
                      <Link key={b._id} href={`/breeding/${b._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {b.dam ? `${b.dam.tagId}${b.dam.name ? ` (${b.dam.name})` : ''}` : '—'}
                          </p>
                          <p className="text-xs text-gray-500">Due {b.expectedDueDate ? formatDate(b.expectedDueDate) : '—'}</p>
                        </div>
                        {days !== null && (
                          <span className={`text-xs font-semibold ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-red-500' : days <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today!' : `${days}d left`}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="flex gap-3 flex-wrap">
                {[
                  { href: '/animals/new', label: '+ Add Animal', icon: '🐄' },
                  { href: '/health/new', label: '+ Log Health Event', icon: '🩺' },
                  { href: '/feeding/new', label: '+ Log Feeding', icon: '🌾' },
                  { href: '/breeding/new', label: '+ Record Breeding', icon: '🐣' },
                ].map(a => (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg text-sm font-medium border border-green-200 transition-colors">
                    <span>{a.icon}</span> {a.label}
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}
      </PageWrapper>
    </>
  )
}

function StatCard({ icon, label, value, href, color }: {
  icon: string; label: string; value: number; href: string;
  color: 'green' | 'blue' | 'yellow' | 'purple'
}) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }
  return (
    <Link href={href}>
      <div className={`rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${colors[color]}`}>
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium opacity-80 mt-0.5">{label}</div>
      </div>
    </Link>
  )
}
