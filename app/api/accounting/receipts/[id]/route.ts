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

    return new Response(new Uint8Array(receipt.fileData), {
      headers: {
        'Content-Type': receipt.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(receipt.fileName)}"`,
        'Content-Length': String(receipt.fileSize),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
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
