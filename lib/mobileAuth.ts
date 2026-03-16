import { connectDB } from '@/lib/db'
import { MobileSession } from '@/models/MobileSession'

export interface MobileUser {
  userId: string
  email: string
}

/** CORS headers for all /api/mobile/* routes */
export function corsHeaders(): Record<string, string> {
  const origin = process.env.RECEIPT_APP_ORIGIN || '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/** OPTIONS preflight response */
export function corsOptionsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

/** Verify Bearer token from Authorization header. Returns null if invalid/expired. */
export async function verifyMobileAuth(req: Request): Promise<MobileUser | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice(7).trim()
  if (!token) return null

  try {
    await connectDB()
    const session = await MobileSession.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).lean()

    if (!session) return null
    return { userId: String(session.userId), email: session.email }
  } catch {
    return null
  }
}
