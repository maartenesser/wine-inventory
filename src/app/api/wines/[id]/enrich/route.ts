import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getWinePrice } from '@/lib/price-scraper'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/wines/[id]/enrich
 * Background enrichment endpoint - fetches price and updates wine
 * Called after quick save to enrich wine data without blocking
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    // Fetch the wine from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wine, error: fetchError } = await (supabase
      .from('wines') as any)
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Wine not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch wine' },
        { status: 500 }
      )
    }

    // Skip if already has price data
    if (wine.price_avg && wine.price_source) {
      return NextResponse.json({
        success: true,
        message: 'Wine already has price data',
        wine,
      })
    }

    // Get price from scraper
    const priceResult = await getWinePrice(
      wine.chateau,
      wine.vintage,
      wine.region,
      wine.bottle_size || 'standard'
    )

    // Prepare updates
    const updates: Record<string, unknown> = {}

    if (priceResult.price_avg) {
      updates.price_min = priceResult.price_min
      updates.price_max = priceResult.price_max
      updates.price_avg = priceResult.price_avg
      updates.price_source = priceResult.source
      updates.currency = priceResult.currency || 'EUR'
    }

    // Only update if we have something to update
    if (Object.keys(updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedWine, error: updateError } = await (supabase
        .from('wines') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Database error updating wine:', updateError)
        return NextResponse.json(
          { error: 'Failed to update wine with enrichment data' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Wine enriched with price data',
        wine: updatedWine,
        priceResult,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No enrichment data found',
      wine,
    })
  } catch (error) {
    console.error('Error enriching wine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
