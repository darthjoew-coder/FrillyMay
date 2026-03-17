import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'
import { Expense } from '@/models/Expense'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// GET: list unlinked mobile receipts (source=mobile, no expenseId) for web review
export async function GET(_req: NextRequest) {
  try {
    await connectDB()
    const docs = await Receipt.find({ source: 'mobile', expenseId: { $exists: false } })
      .select('-imageData -thumbnailData -rawApiResponse')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const receipts = docs.map(doc => {
      const r = { ...doc } as Record<string, unknown>
      if (doc.thumbnailData) {
        r.thumbnailBase64 = `data:image/jpeg;base64,${(doc.thumbnailData as Buffer).toString('base64')}`
      }
      delete r.thumbnailData
      return r
    })

    return NextResponse.json({ data: receipts })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const expenseId = formData.get('expenseId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!expenseId) return NextResponse.json({ error: 'expenseId is required' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported. Use JPEG, PNG, WebP, HEIC, or PDF.' }, { status: 400 })
    }

    // Verify expense exists
    const expense = await Expense.findById(expenseId)
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const receipt = await Receipt.create({
      source: 'web',
      expenseId,
      fileName: file.name,
      imageMimeType: file.type,
      imageSize: file.size,
      imageData: buffer,
    })

    return NextResponse.json({
      data: {
        _id: receipt._id,
        expenseId: receipt.expenseId,
        fileName: receipt.fileName,
        imageMimeType: receipt.imageMimeType,
        imageSize: receipt.imageSize,
        uploadedAt: receipt.uploadedAt,
      },
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
