import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'
import { Expense } from '@/models/Expense'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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
