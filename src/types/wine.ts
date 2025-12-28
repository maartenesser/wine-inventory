export interface Wine {
  id: string
  chateau: string
  wine_name: string | null
  vintage: number | null
  region: string | null
  appellation: string | null
  country: string | null
  grape_variety: string | null
  color: 'red' | 'white' | 'rosé' | 'sparkling' | 'champagne' | 'dessert' | null
  alcohol_pct: number | null
  bottle_size: string | null  // e.g., 'standard', 'magnum', 'double_magnum'
  quantity: number
  price_min: number | null
  price_max: number | null
  price_avg: number | null
  price_source: 'wine-searcher' | 'vivino' | 'google' | 'manual' | null
  currency: string
  image_url: string | null
  image_data: string | null
  location_id: string | null
  locations: { id: string; name: string } | null
  food_pairing: string[] | null
  tasting_notes: string | null
  winemaker_info: string | null
  drinking_window: string | null
  created_at: string
  updated_at: string
}

export interface WineFormData {
  chateau: string
  wine_name?: string
  vintage?: number
  region?: string
  appellation?: string
  country?: string
  grape_variety?: string
  color?: 'red' | 'white' | 'rosé' | 'sparkling' | 'champagne' | 'dessert'
  alcohol_pct?: number
  bottle_size?: string
  quantity: number
  price_avg?: number
  image_url?: string
}

export interface GeminiWineExtraction {
  chateau: string | null
  wine_name: string | null
  vintage: number | null
  region: string | null
  appellation: string | null
  country: string | null
  grape_variety: string | null
  color: 'red' | 'white' | 'rosé' | 'sparkling' | 'champagne' | 'dessert' | null
  alcohol_pct: number | null
  winemaker_info: string | null
  food_pairing: string[] | null
  tasting_notes: string | null
  drinking_window: string | null
  confidence: {
    chateau: number
    vintage: number
    region: number
  }
}

export interface PriceResult {
  price_min: number | null
  price_max: number | null
  price_avg: number | null
  source: 'wine-searcher' | 'vivino' | 'google' | null
  currency: string
}

export interface DashboardStats {
  totalWines: number
  totalBottles: number
  totalValue: number
  avgBottlePrice: number
  winesByRegion: { region: string; count: number; value: number }[]
  winesByColor: { color: string; count: number }[]
  recentAdditions: Wine[]
}
