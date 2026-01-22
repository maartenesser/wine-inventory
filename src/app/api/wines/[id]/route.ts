import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getUser } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type WineUpdate = Database['public']['Tables']['wines']['Update']

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/wines/[id] - Get a single wine
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Wine not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wine' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wine: data })
  } catch (error) {
    console.error('Error fetching wine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/wines/[id] - Update a wine
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createServerSupabase()

    // Check authentication
    const { user, error: authError } = await getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only include fields that are provided
    const updates: WineUpdate = {}
    const allowedFields = [
      'chateau', 'wine_name', 'vintage', 'region', 'appellation',
      'country', 'grape_variety', 'color', 'alcohol_pct', 'quantity',
      'price_min', 'price_max', 'price_avg', 'price_source', 'currency',
      'image_url', 'image_data', 'location_id', 'food_pairing', 'tasting_notes',
      'winemaker_info', 'drinking_window'
    ] as const

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updates as Record<string, unknown>)[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('wines')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Wine not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update wine' },
        { status: 500 }
      )
    }

    return NextResponse.json({ wine: data })
  } catch (error) {
    console.error('Error updating wine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/wines/[id] - Delete a wine
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete wine' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wine:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
