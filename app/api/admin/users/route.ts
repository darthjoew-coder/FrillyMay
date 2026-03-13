import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const query = status && status !== 'all' ? { status } : {}
    const users = await User.find(query).sort({ createdAt: -1 }).lean()

    return NextResponse.json({ data: users })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
