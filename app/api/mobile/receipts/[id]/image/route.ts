import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { MobileReceipt } from '@/models/MobileReceipt'
import { verifyMobileAuth, corsHeaders, corsOptionsResponse } from '@/lib/mobileAuth'
import mongoose from 'mongoose'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await verifyMobileAuth(req)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  try {
    await connectDB()
    const { id } = await params
    const doc = await MobileReceipt.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(user.userId),
    }).select('imageData imageMimeType').lean()

    if (!doc || !doc.imageData) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }

    return new Response(new Uint8Array(doc.imageData as Buffer), {
      headers: {
        'Content-Type': doc.imageMimeType,
        'Cache-Control': 'private, max-age=3600',
        ...corsHeaders(),
      },
    })
  } catch (err) {
    console.error('[mobile/receipts/[id]/image GET]', err)
    return new Response(JSON.stringify({ error: 'Failed to load image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
