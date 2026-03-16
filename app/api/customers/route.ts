import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Customer } from '@/models/Customer'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') || ''
    const isActiveParam = searchParams.get('isActive')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = {}
    if (isActiveParam !== null && isActiveParam !== 'all') {
      filter.isActive = isActiveParam === 'true'
    }
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const [data, total] = await Promise.all([
      Customer.find(filter).sort({ lastName: 1, firstName: 1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ])

    return NextResponse.json({ data, total, page })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { firstName, lastName, businessName } = body

    // Auto-build displayName if not provided
    if (!body.displayName) {
      body.displayName = businessName
        ? businessName
        : `${firstName} ${lastName}`.trim()
    }

    const customer = await Customer.create(body)
    return NextResponse.json({ data: customer.toObject() }, { status: 201 })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Failed to create customer'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
