import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Customer } from '@/models/Customer'
import { Sale } from '@/models/Sale'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const customer = await Customer.findById(id).lean()
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const currentYear = new Date().getFullYear()
    const [lifetimeAgg, ytdAgg, lastSale] = await Promise.all([
      Sale.aggregate([
        { $match: { customerId: customer._id } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { customerId: customer._id, taxYear: currentYear } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Sale.findOne({ customerId: customer._id }).sort({ date: -1 }).select('date').lean(),
    ])

    const lifetimeTotal = lifetimeAgg[0]?.total ?? 0
    const orderCount = lifetimeAgg[0]?.count ?? 0
    const ytdTotal = ytdAgg[0]?.total ?? 0
    const summary = {
      lifetimeTotal,
      ytdTotal,
      orderCount,
      avgSale: orderCount > 0 ? lifetimeTotal / orderCount : 0,
      lastSaleDate: lastSale?.date ? String(lastSale.date) : undefined,
    }

    return NextResponse.json({ data: customer, summary })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    // Rebuild displayName if names changed and no explicit displayName sent
    if (!body.displayName && (body.firstName || body.lastName || body.businessName)) {
      const existing = await Customer.findById(id).lean()
      const firstName = body.firstName ?? existing?.firstName ?? ''
      const lastName = body.lastName ?? existing?.lastName ?? ''
      const businessName = body.businessName ?? existing?.businessName
      body.displayName = businessName ? businessName : `${firstName} ${lastName}`.trim()
    }

    const customer = await Customer.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: customer })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Failed to update customer'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    // Soft-delete if customer has any sales, hard-delete otherwise
    const saleCount = await Sale.countDocuments({ customerId: id })
    if (saleCount > 0) {
      await Customer.findByIdAndUpdate(id, { isActive: false })
      return NextResponse.json({ data: { deactivated: true, saleCount } })
    }

    await Customer.findByIdAndDelete(id)
    return NextResponse.json({ data: { deleted: true } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
