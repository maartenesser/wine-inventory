import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getUser } from '@/lib/supabase'
import { getWinePrice } from '@/lib/price-scraper'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

interface RouteParams {
  params: Promise<{ id: string }>
}

interface WineEnrichment {
  region: string | null
  country: string | null
  appellation: string | null
  grape_variety: string | null
  tasting_notes: string | null
  food_pairing: string[] | null
  drinking_window: string | null
  winemaker_info: string | null
}

/**
 * Look up wine information using Gemini
 */
async function enrichWineInfo(chateau: string, wineName: string | null, vintage: number | null, color: string | null): Promise<WineEnrichment | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const prompt = `You are a wine expert. Look up information about this wine:
Producer/Chateau: ${chateau}
${wineName ? `Wine Name: ${wineName}` : ''}
${vintage ? `Vintage: ${vintage}` : ''}
${color ? `Type: ${color}` : ''}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "region": "Wine region (e.g., Bordeaux, Burgundy, Champagne, Napa Valley)",
  "country": "Country of origin",
  "appellation": "Specific appellation if known (e.g., Saint-Émilion Grand Cru, Pauillac)",
  "grape_variety": "Main grape varieties used",
  "tasting_notes": "Brief description of taste profile, body, aromas (2-3 sentences)",
  "food_pairing": ["dish1", "dish2", "dish3"],
  "drinking_window": "e.g., 2024-2030 or Drink now",
  "winemaker_info": "Brief info about the producer/chateau (1-2 sentences)"
}

If you cannot find reliable information about a field, set it to null.
Focus on accuracy - only include information you are confident about.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()

    // Clean up markdown if present
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()

    return JSON.parse(text)
  } catch (error) {
    console.error('Error enriching wine info with Gemini:', error)
    return null
  }
}

/**
 * POST /api/wines/[id]/enrich
 * Background enrichment endpoint - fetches price and wine info
 * Called after quick save to enrich wine data without blocking
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { user, error: authError } = await getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the wine from database (must belong to user)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wine, error: fetchError } = await (supabase
      .from('wines') as any)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
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

    // Prepare updates
    const updates: Record<string, unknown> = {}

    // 1. Enrich wine information (region, grape, etc.) if missing
    const needsInfoEnrichment = !wine.region || !wine.grape_variety || !wine.drinking_window
    if (needsInfoEnrichment) {
      const wineInfo = await enrichWineInfo(wine.chateau, wine.wine_name, wine.vintage, wine.color)
      if (wineInfo) {
        // Only update fields that are currently empty
        if (!wine.region && wineInfo.region) updates.region = wineInfo.region
        if (!wine.country && wineInfo.country) updates.country = wineInfo.country
        if (!wine.appellation && wineInfo.appellation) updates.appellation = wineInfo.appellation
        if (!wine.grape_variety && wineInfo.grape_variety) updates.grape_variety = wineInfo.grape_variety
        if (!wine.tasting_notes && wineInfo.tasting_notes) updates.tasting_notes = wineInfo.tasting_notes
        if (!wine.food_pairing && wineInfo.food_pairing) updates.food_pairing = wineInfo.food_pairing
        if (!wine.drinking_window && wineInfo.drinking_window) updates.drinking_window = wineInfo.drinking_window
        if (!wine.winemaker_info && wineInfo.winemaker_info) updates.winemaker_info = wineInfo.winemaker_info
      }
    }

    // 2. Get price if missing
    if (!wine.price_avg) {
      const priceResult = await getWinePrice(
        wine.chateau,
        wine.vintage,
        updates.region as string || wine.region, // Use newly found region if available
        wine.bottle_size || 'standard'
      )

      if (priceResult.price_avg) {
        updates.price_min = priceResult.price_min
        updates.price_max = priceResult.price_max
        updates.price_avg = priceResult.price_avg
        updates.price_source = priceResult.source
        updates.currency = priceResult.currency || 'EUR'
      }
    }

    // Only update if we have something to update
    if (Object.keys(updates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedWine, error: updateError } = await (supabase
        .from('wines') as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
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
        message: 'Wine enriched successfully',
        wine: updatedWine,
        enrichedFields: Object.keys(updates),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Wine already fully enriched',
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
