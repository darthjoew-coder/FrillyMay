import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'

// GET: stream the binary file
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    // Do NOT use .lean() - we need the Buffer intact
    const receipt = await Receipt.findById(id)
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })

    // Support both old web receipts (fileData/mimeType/fileSize) and new unified receipts (imageData/imageMimeType/imageSize)
    const raw = receipt as unknown as Record<string, unknown>
    const imageData = (receipt.imageData || raw.fileData) as Buffer | undefined
    const mimeType = receipt.imageMimeType || (raw.mimeType as string | undefined) || 'application/octet-stream'
    const fileName = receipt.fileName || 'receipt'
    const size = receipt.imageSize || (raw.fileSize as number | undefined) || 0

    if (!imageData) return NextResponse.json({ error: 'Image data not found' }, { status: 404 })

    return new Response(new Uint8Array(imageData), {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(size),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()
    const allowed = { status: body.status }
    const receipt = await Receipt.findByIdAndUpdate(id, allowed, { new: true, runValidators: true }).lean()
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    return NextResponse.json({ data: receipt })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const receipt = await Receipt.findById(id)
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    await Receipt.findByIdAndDelete(id)
    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
