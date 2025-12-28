import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// GET /api/wines - List all wines
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('wines') as any)
      .select('*, locations(id, name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wines' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wines: data })
  } catch (error) {
    console.error('Error fetching wines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wines - Create a new wine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerSupabaseClient()

    const wine = {
      id: uuidv4(),
      chateau: body.chateau,
      wine_name: body.wine_name || null,
      vintage: body.vintage || null,
      region: body.region || null,
      appellation: body.appellation || null,
      country: body.country || null,
      grape_variety: body.grape_variety || null,
      color: body.color || null,
      alcohol_pct: body.alcohol_pct || null,
      quantity: body.quantity || 1,
      price_min: body.price_min || null,
      price_max: body.price_max || null,
      price_avg: body.price_avg || null,
      price_source: body.price_source || null,
      currency: body.currency || 'EUR',
      image_url: body.image_url || null,
      image_data: body.image_data || null,
      location_id: body.location_id || null,
      food_pairing: body.food_pairing || null,
      tasting_notes: body.tasting_notes || null,
      winemaker_info: body.winemaker_info || null,
      drinking_window: body.drinking_window || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('wines') as any)
      .insert(wine)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create wine' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wine: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating wine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
