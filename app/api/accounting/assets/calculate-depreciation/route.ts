import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { FarmAsset } from '@/models/FarmAsset'
import { AssetDepreciation } from '@/models/AssetDepreciation'

/**
 * IRS GDS MACRS percentage tables (half-year convention, 200% DB switching to SL).
 * Source: IRS Rev. Proc. 87-56, Table A-1.
 * Key = recovery period in years. Values = annual % of original cost basis for each year of life.
 */
const MACRS_TABLES: Record<number, number[]> = {
  3:  [33.33, 44.45, 14.81, 7.41],
  5:  [20.00, 32.00, 19.20, 11.52, 11.52, 5.76],
  7:  [14.29, 24.49, 17.49, 12.49, 8.93, 8.92, 8.93, 4.46],
  10: [10.00, 18.00, 14.40, 11.52, 9.22, 7.37, 6.55, 6.55, 6.56, 6.55, 3.28],
  15: [5.00, 9.50, 8.55, 7.70, 6.93, 6.23, 5.90, 5.90, 5.91, 5.90, 5.91, 5.90, 5.91, 5.90, 5.91, 2.95],
  20: [3.750, 7.219, 6.677, 6.177, 5.713, 5.285, 4.888, 4.522, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 4.462, 4.461, 2.231],
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * Calculate the depreciation deduction for a specific year of an asset's life.
 * yearOfLife: 1 = first year placed in service, 2 = second year, etc.
 */
function calcYearDeduction(
  method: string,
  costBasis: number,
  salvageValue: number,
  usefulLifeYears: number,
  section179Amount: number,
  bonusDepreciationPct: number,
  yearOfLife: number
): number {
  if (yearOfLife < 1) return 0

  switch (method) {
    case 'not_depreciable':
      return 0

    case 'section_179':
      // Full §179 election in year 1; remaining basis (if any) follows MACRS in subsequent years
      if (yearOfLife === 1) return round2(section179Amount)
      // Remaining basis after §179 depreciated via MACRS
      const remainingAfter179 = costBasis - section179Amount
      if (remainingAfter179 <= 0) return 0
      return calcMACRS(remainingAfter179, usefulLifeYears, yearOfLife)

    case 'bonus': {
      // Bonus depreciation in year 1 on the full basis
      if (yearOfLife === 1) return round2(costBasis * (bonusDepreciationPct / 100))
      // Remaining basis after bonus depreciated via MACRS
      const remainingAfterBonus = costBasis * (1 - bonusDepreciationPct / 100)
      if (remainingAfterBonus <= 0) return 0
      return calcMACRS(remainingAfterBonus, usefulLifeYears, yearOfLife)
    }

    case 'straight_line': {
      // Half-year convention: year 1 and the extra year get half the annual amount
      const annual = round2((costBasis - salvageValue) / usefulLifeYears)
      const halfYear = round2(annual / 2)
      if (yearOfLife === 1) return halfYear
      if (yearOfLife <= usefulLifeYears) return annual
      if (yearOfLife === usefulLifeYears + 1) return halfYear // final half-year
      return 0
    }

    case 'macrs':
    default:
      return calcMACRS(costBasis, usefulLifeYears, yearOfLife)
  }
}

function calcMACRS(basis: number, usefulLifeYears: number, yearOfLife: number): number {
  // Find the closest table (3, 5, 7, 10, 15, 20)
  const keys = Object.keys(MACRS_TABLES).map(Number).sort((a, b) => a - b)
  const tableKey = keys.find(k => k >= usefulLifeYears) ?? keys[keys.length - 1]
  const table = MACRS_TABLES[tableKey]
  if (!table || yearOfLife < 1 || yearOfLife > table.length) return 0
  return round2(basis * (table[yearOfLife - 1] / 100))
}

/**
 * Calculate the full depreciation schedule for an asset through a given tax year.
 * Returns an array where index 0 = year 1, index 1 = year 2, etc.
 */
function buildSchedule(
  method: string,
  costBasis: number,
  salvageValue: number,
  usefulLifeYears: number,
  section179Amount: number,
  bonusDepreciationPct: number,
  throughYearOfLife: number
): number[] {
  const schedule: number[] = []
  for (let y = 1; y <= throughYearOfLife; y++) {
    schedule.push(calcYearDeduction(method, costBasis, salvageValue, usefulLifeYears, section179Amount, bonusDepreciationPct, y))
  }
  return schedule
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const taxYear = Number(searchParams.get('year') || new Date().getFullYear())

    const assets = await FarmAsset.find({ status: { $in: ['active', 'fully_depreciated'] } }).lean() as any[]

    let created = 0
    let updated = 0
    let skipped = 0
    const details: string[] = []

    for (const asset of assets) {
      const placedYear = new Date(asset.placedInServiceDate).getFullYear()

      // Asset not yet placed in service for this tax year
      if (placedYear > taxYear) {
        skipped++
        continue
      }

      // Asset is fully depreciated and has no more deductions expected
      if (asset.depreciationMethod === 'not_depreciable') {
        skipped++
        continue
      }

      const yearOfLife = taxYear - placedYear + 1

      // Build full schedule to get current year deduction and accumulated total
      const schedule = buildSchedule(
        asset.depreciationMethod,
        asset.costBasis,
        asset.salvageValue ?? 0,
        asset.usefulLifeYears,
        asset.section179Amount ?? 0,
        asset.bonusDepreciationPct ?? 0,
        yearOfLife
      )

      const deduction = schedule[yearOfLife - 1] ?? 0
      const accumulated = round2(schedule.reduce((s, v) => s + v, 0))
      const basisAtStart = round2(asset.costBasis - (accumulated - deduction))

      // No deduction this year (fully depreciated or beyond recovery period)
      if (deduction === 0 && yearOfLife > 1) {
        skipped++
        continue
      }

      const methodLabel = asset.depreciationMethod === 'macrs'
        ? `MACRS ${asset.usefulLifeYears}-yr half-year convention (Year ${yearOfLife})`
        : asset.depreciationMethod

      const existing = await AssetDepreciation.findOne({ assetId: asset._id, taxYear })

      if (!existing) {
        await AssetDepreciation.create({
          assetId: asset._id,
          taxYear,
          depreciationAmount: deduction,
          method: asset.depreciationMethod,
          basisAtStartOfYear: basisAtStart,
          accumulatedDepreciation: accumulated,
          notes: methodLabel,
        })
        created++
        details.push(`Created: ${asset.name} (${taxYear}) — $${deduction.toLocaleString()}`)
      } else {
        const needsUpdate =
          Math.abs(existing.depreciationAmount - deduction) > 0.01 ||
          Math.abs(existing.accumulatedDepreciation - accumulated) > 0.01 ||
          Math.abs(existing.basisAtStartOfYear - basisAtStart) > 0.01

        if (needsUpdate) {
          await AssetDepreciation.updateOne(
            { _id: existing._id },
            {
              depreciationAmount: deduction,
              method: asset.depreciationMethod,
              basisAtStartOfYear: basisAtStart,
              accumulatedDepreciation: accumulated,
              notes: methodLabel,
            }
          )
          updated++
          details.push(`Updated: ${asset.name} (${taxYear}) — $${deduction.toLocaleString()} (was $${existing.depreciationAmount.toLocaleString()})`)
        } else {
          skipped++
        }
      }
    }

    return NextResponse.json({ success: true, taxYear, created, updated, skipped, details })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
