import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getUser } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// GET /api/wines - List all wines for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { user, error: authError } = await getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isLite = request.nextUrl.searchParams.get('lite') === '1'
    const selectFields = isLite
      ? 'id, chateau, wine_name, vintage, region, appellation, country, grape_variety, color, alcohol_pct, quantity, bottle_size, price_min, price_max, price_avg, price_source, currency, image_url, location_id, drinking_window, created_at, locations(id, name)'
      : '*, locations(id, name)'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('wines') as any)
      .select(selectFields)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wines' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { wines: data },
      {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching wines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wines - Create a new wine for the current user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { user, error: authError } = await getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const wine = {
      id: uuidv4(),
      user_id: user.id,  // Associate wine with current user
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
      bottle_size: body.bottle_size || 'standard',
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
