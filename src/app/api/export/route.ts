import { NextResponse } from 'next/server'
import { createServerSupabase, getUser } from '@/lib/supabase'
import type { Database } from '@/types/database'
import * as XLSX from 'xlsx'

type Wine = Database['public']['Tables']['wines']['Row']

// GET /api/export - Export wines to Excel
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
      .from('wines') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('chateau', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wines for export' },
        { status: 500 }
      )
    }

    const wines = (data || []) as Wine[]

    // Transform data for Excel
    const excelData = wines.map((wine) => ({
      'Chateau/Producer': wine.chateau,
      'Wine Name': wine.wine_name || '',
      'Vintage': wine.vintage || '',
      'Region': wine.region || '',
      'Appellation': wine.appellation || '',
      'Country': wine.country || '',
      'Grape Variety': wine.grape_variety || '',
      'Color': wine.color || '',
      'Alcohol %': wine.alcohol_pct || '',
      'Quantity': wine.quantity,
      'Price (Min)': wine.price_min || '',
      'Price (Max)': wine.price_max || '',
      'Price (Avg)': wine.price_avg || '',
      'Total Value': wine.price_avg ? wine.price_avg * wine.quantity : '',
      'Currency': wine.currency,
      'Price Source': wine.price_source || '',
      'Added On': new Date(wine.created_at).toLocaleDateString(),
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Chateau
      { wch: 20 }, // Wine Name
      { wch: 8 },  // Vintage
      { wch: 15 }, // Region
      { wch: 20 }, // Appellation
      { wch: 12 }, // Country
      { wch: 20 }, // Grape
      { wch: 10 }, // Color
      { wch: 10 }, // Alcohol
      { wch: 8 },  // Quantity
      { wch: 12 }, // Price Min
      { wch: 12 }, // Price Max
      { wch: 12 }, // Price Avg
      { wch: 12 }, // Total Value
      { wch: 8 },  // Currency
      { wch: 12 }, // Source
      { wch: 12 }, // Added On
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Wine Inventory')

    // Add summary sheet
    const totalBottles = wines.reduce((sum, w) => sum + w.quantity, 0)
    const totalValue = wines.reduce((sum, w) => sum + (w.price_avg || 0) * w.quantity, 0)
    const avgPrice = totalValue / totalBottles || 0

    const summaryData = [
      { 'Metric': 'Total Unique Wines', 'Value': wines.length },
      { 'Metric': 'Total Bottles', 'Value': totalBottles },
      { 'Metric': 'Total Collection Value', 'Value': `€${totalValue.toFixed(2)}` },
      { 'Metric': 'Average Bottle Price', 'Value': `€${avgPrice.toFixed(2)}` },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
    ]

    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="wine-inventory-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error exporting wines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
