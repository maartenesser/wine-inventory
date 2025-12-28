import { NextRequest, NextResponse } from 'next/server'
import { extractWineFromImage } from '@/lib/gemini'
import { getWinePrice } from '@/lib/price-scraper'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File | null
    const bottleSize = formData.get('bottle_size') as string | null

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

    // Extract wine info from image using Gemini
    const wineInfo = await extractWineFromImage(base64, image.type)

    // Get price if we have a chateau name (pass bottle size for price lookup)
    let priceInfo = null
    if (wineInfo.chateau) {
      priceInfo = await getWinePrice(
        wineInfo.chateau,
        wineInfo.vintage,
        wineInfo.region,
        bottleSize || 'standard'
      )
    }

    return NextResponse.json({
      success: true,
      wine: wineInfo,
      price: priceInfo,
    })
  } catch (error) {
    console.error('Scan error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to scan wine label'
    const isQuotaError = errorMessage.includes('quota')

    return NextResponse.json(
      { error: errorMessage },
      { status: isQuotaError ? 429 : 500 }
    )
  }
}
