import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, getUser } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

// GET /api/locations - List all locations for the current user
export async function GET() {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('locations') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { locations: data || [] },
      {
        headers: {
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create a new location for the current user
export async function POST(request: NextRequest) {
  try {
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

    if (!body.name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      )
    }

    const location = {
      id: uuidv4(),
      user_id: user.id,
      name: body.name,
      description: body.description || null,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('locations') as any)
      .insert(location)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      )
    }

    return NextResponse.json({ location: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
