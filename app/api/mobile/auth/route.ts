import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { MobileSession } from '@/models/MobileSession'
import { corsHeaders, corsOptionsResponse } from '@/lib/mobileAuth'
import crypto from 'crypto'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders()
  try {
    const { credential } = await req.json()
    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400, headers })
    }

    // Verify Google ID token using Google's tokeninfo endpoint
    const tokenRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    )
    if (!tokenRes.ok) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401, headers })
    }

    const tokenData = await tokenRes.json()

    // Verify the audience matches our Google Client ID
    if (
      tokenData.aud !== process.env.GOOGLE_CLIENT_ID &&
      tokenData.azp !== process.env.GOOGLE_CLIENT_ID
    ) {
      return NextResponse.json({ error: 'Token audience mismatch' }, { status: 401, headers })
    }

    const { email, name, picture } = tokenData
    if (!email) {
      return NextResponse.json({ error: 'No email in token' }, { status: 401, headers })
    }

    await connectDB()

    // Find or create user — same Users collection as the main app
    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        email,
        name: name || email,
        image: picture || null,
        status: 'pending',
        isAdmin: false,
      })
    } else {
      await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() })
    }

    if (user.status !== 'approved') {
      return NextResponse.json(
        { error: `Account ${user.status}. Contact your administrator for access.` },
        { status: 403, headers }
      )
    }

    // Create a 30-day session token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await MobileSession.create({ token, userId: user._id, email, expiresAt })

    return NextResponse.json(
      {
        token,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: String(user._id),
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
        },
      },
      { headers }
    )
  } catch (err) {
    console.error('[mobile/auth]', err)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500, headers })
  }
}
