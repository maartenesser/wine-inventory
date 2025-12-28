import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint runs database migrations
// It uses the service role key which has more permissions
export async function POST(request: NextRequest) {
  try {
    // Check for admin secret (simple protection)
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== 'run-migration-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing Supabase credentials',
        hint: 'Add SUPABASE_SERVICE_ROLE_KEY to your environment variables'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Run migrations using raw SQL via RPC
    // First, let's try to add the columns by attempting updates
    const migrations = [
      'ALTER TABLE wines ADD COLUMN IF NOT EXISTS winemaker_info TEXT',
      'ALTER TABLE wines ADD COLUMN IF NOT EXISTS drinking_window TEXT',
    ]

    const results = []

    for (const sql of migrations) {
      // Use the SQL function if available, otherwise skip
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
      results.push({ sql, error: error?.message || 'OK' })
    }

    return NextResponse.json({
      message: 'Migration attempted',
      results,
      note: 'If this fails, run the SQL manually in Supabase SQL Editor'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Migration endpoint',
    usage: 'POST /api/migrate?secret=run-migration-2024',
    manual_sql: `
-- Run this in Supabase SQL Editor:
ALTER TABLE wines ADD COLUMN IF NOT EXISTS winemaker_info TEXT;
ALTER TABLE wines ADD COLUMN IF NOT EXISTS drinking_window TEXT;
    `.trim()
  })
}
