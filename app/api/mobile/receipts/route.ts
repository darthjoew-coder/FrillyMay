import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Receipt } from '@/models/Receipt'
import { Expense } from '@/models/Expense'
import { ExpenseCategory } from '@/models/ExpenseCategory'
import { verifyMobileAuth, corsHeaders, corsOptionsResponse } from '@/lib/mobileAuth'
import mongoose from 'mongoose'

function mapPaymentMethod(pm?: string): string {
  if (!pm) return 'other'
  const lower = pm.toLowerCase()
  if (lower.includes('cash')) return 'cash'
  if (lower.includes('check') || lower.includes('cheque')) return 'check'
  if (lower.includes('credit')) return 'credit_card'
  if (lower.includes('debit')) return 'debit_card'
  if (lower.includes('bank') || lower.includes('transfer') || lower.includes('ach')) return 'bank_transfer'
  return 'other'
}

/** Find or create a default expense category for auto-created expenses */
async function getDefaultCategoryId(): Promise<mongoose.Types.ObjectId> {
  let cat = await ExpenseCategory.findOne({ type: 'expense', active: true }).sort({ sortOrder: 1 }).lean()
  if (!cat) {
    cat = await ExpenseCategory.create({ name: 'General', type: 'expense', scheduleFBucket: '', active: true, sortOrder: 0 })
  }
  return cat._id as mongoose.Types.ObjectId
}

/** Create a draft Expense from OCR-extracted receipt data and link the receipt */
export async function createExpenseFromReceipt(
  extractedData: Record<string, unknown>,
  receiptId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId> {
  const categoryId = await getDefaultCategoryId()

  const rawDate = extractedData.receiptDate as string | undefined
  const date = rawDate ? new Date(rawDate) : new Date()
  const taxYear = date.getFullYear()

  const expense = await Expense.create({
    vendor: (extractedData.merchantName as string | undefined) || 'Unknown Vendor',
    amount: (extractedData.totalAmount as number | undefined) ?? 0,
    date,
    taxYear,
    categoryId,
    paymentMethod: mapPaymentMethod(extractedData.paymentMethod as string | undefined),
    productLine: 'general',
    status: 'draft',
    description: 'Auto-created from mobile receipt',
  })

  await Receipt.findByIdAndUpdate(receiptId, { expenseId: expense._id })
  return expense._id as mongoose.Types.ObjectId
}

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders()
  const user = await verifyMobileAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  try {
    await connectDB()
    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const status = searchParams.get('status')

    const filter: Record<string, unknown> = {
      source: 'mobile',
      userId: new mongoose.Types.ObjectId(user.userId),
    }
    if (status) filter.status = status

    const [docs, total] = await Promise.all([
      Receipt.find(filter)
        .select('-imageData -rawApiResponse') // exclude heavy binary fields from list
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ])

    // Convert thumbnail Buffer to base64 for list display
    const receipts = docs.map(doc => {
      const r = { ...doc } as Record<string, unknown>
      if (doc.thumbnailData) {
        r.thumbnailBase64 = `data:image/jpeg;base64,${(doc.thumbnailData as Buffer).toString('base64')}`
      }
      delete r.thumbnailData
      return r
    })

    return NextResponse.json({ data: receipts, total, page }, { headers })
  } catch (err) {
    console.error('[mobile/receipts GET]', err)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500, headers })
  }
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders()
  const user = await verifyMobileAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  try {
    await connectDB()
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const thumbnailBase64 = formData.get('thumbnail') as string | null
    const extractedDataStr = formData.get('extractedData') as string | null

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400, headers })

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Use JPEG, PNG, WebP, HEIC, or PDF.' }, { status: 400, headers })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400, headers })
    }

    const arrayBuffer = await file.arrayBuffer()
    const imageData = Buffer.from(arrayBuffer)

    // Convert base64 thumbnail to Buffer if provided
    let thumbnailData: Buffer | undefined
    if (thumbnailBase64) {
      const base64Data = thumbnailBase64.replace(/^data:image\/\w+;base64,/, '')
      thumbnailData = Buffer.from(base64Data, 'base64')
    }

    // Parse extracted OCR data
    let extractedData: Record<string, unknown> = {}
    let status: 'processing' | 'needs_review' | 'completed' = 'processing'
    let extractionStatus: 'processing' | 'completed' | 'failed' | 'skipped' = 'processing'

    if (extractedDataStr) {
      try {
        extractedData = JSON.parse(extractedDataStr)
        extractionStatus = extractedData.error ? 'failed' : 'completed'
        status = 'needs_review'
      } catch {
        extractionStatus = 'failed'
        status = 'needs_review'
      }
    }

    const receipt = await Receipt.create({
      source: 'mobile',
      userId: new mongoose.Types.ObjectId(user.userId),
      imageData,
      imageMimeType: file.type,
      imageSize: file.size,
      thumbnailData,
      uploadStatus: 'completed',
      extractionStatus,
      status,
      merchantName: extractedData.merchantName as string | undefined,
      receiptDate: extractedData.receiptDate ? new Date(extractedData.receiptDate as string) : undefined,
      totalAmount: extractedData.totalAmount as number | undefined,
      subtotalAmount: extractedData.subtotalAmount as number | undefined,
      taxAmount: extractedData.taxAmount as number | undefined,
      category: extractedData.category as string | undefined,
      paymentMethod: extractedData.paymentMethod as string | undefined,
      lineItems: extractedData.lineItems as Array<{ description: string; amount?: number }> | undefined,
      rawApiResponse: extractedData.rawApiResponse as Record<string, unknown> | undefined,
      extractedText: extractedData.extractedText as string | undefined,
    })

    // Auto-create a draft expense linked to this receipt
    await createExpenseFromReceipt(extractedData, receipt._id as mongoose.Types.ObjectId)

    // Return without binary fields
    const responseData = receipt.toObject() as unknown as Record<string, unknown>
    delete responseData.imageData
    delete responseData.thumbnailData
    delete responseData.rawApiResponse

    return NextResponse.json({ data: responseData }, { status: 201, headers })
  } catch (err) {
    console.error('[mobile/receipts POST]', err)
    return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500, headers })
  }
}
