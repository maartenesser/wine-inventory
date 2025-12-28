import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/wines/[id] - Get a single wine
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .eq('id', id)
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
    const supabase = createServerSupabaseClient()

    // Only include fields that are provided
    const updates: Record<string, unknown> = {}
    const allowedFields = [
      'chateau', 'wine_name', 'vintage', 'region', 'appellation',
      'country', 'grape_variety', 'color', 'alcohol_pct', 'quantity',
      'price_min', 'price_max', 'price_avg', 'price_source', 'currency',
      'image_url', 'food_pairing', 'tasting_notes'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('wines')
      .update(updates)
      .eq('id', id)
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
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('wines')
      .delete()
      .eq('id', id)

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
