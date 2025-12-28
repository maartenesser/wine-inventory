import { NextRequest, NextResponse } from 'next/server'
import { extractWineQuick } from '@/lib/gemini'

/**
 * Quick scan endpoint - only does fast OCR to extract essential wine info
 * No price lookup, no additional research - just reads the label
 * Used for fast batch scanning in wine cellars
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File | null

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Quick extraction - only reads the label, no additional research
    const wineInfo = await extractWineQuick(base64, image.type)

    return NextResponse.json({
      success: true,
      wine: wineInfo,
    })
  } catch (error) {
    console.error('Quick scan error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to scan wine label'
    const isQuotaError = errorMessage.includes('quota')

    return NextResponse.json(
      { error: errorMessage },
      { status: isQuotaError ? 429 : 500 }
    )
  }
}
