export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      wines: {
        Row: {
          id: string
          chateau: string
          wine_name: string | null
          vintage: number | null
          region: string | null
          appellation: string | null
          country: string | null
          grape_variety: string | null
          color: string | null
          alcohol_pct: number | null
          quantity: number
          price_min: number | null
          price_max: number | null
          price_avg: number | null
          price_source: string | null
          currency: string
          image_url: string | null
          image_data: string | null
          location_id: string | null
          food_pairing: Json | null
          tasting_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chateau: string
          wine_name?: string | null
          vintage?: number | null
          region?: string | null
          appellation?: string | null
          country?: string | null
          grape_variety?: string | null
          color?: string | null
          alcohol_pct?: number | null
          quantity?: number
          price_min?: number | null
          price_max?: number | null
          price_avg?: number | null
          price_source?: string | null
          currency?: string
          image_url?: string | null
          image_data?: string | null
          location_id?: string | null
          food_pairing?: Json | null
          tasting_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chateau?: string
          wine_name?: string | null
          vintage?: number | null
          region?: string | null
          appellation?: string | null
          country?: string | null
          grape_variety?: string | null
          color?: string | null
          alcohol_pct?: number | null
          quantity?: number
          price_min?: number | null
          price_max?: number | null
          price_avg?: number | null
          price_source?: string | null
          currency?: string
          image_url?: string | null
          image_data?: string | null
          location_id?: string | null
          food_pairing?: Json | null
          tasting_notes?: string | null
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      price_history: {
        Row: {
          id: string
          wine_id: string
          price: number
          source: string
          fetched_at: string
        }
        Insert: {
          id?: string
          wine_id: string
          price: number
          source: string
          fetched_at?: string
        }
        Update: {
          id?: string
          wine_id?: string
          price?: number
          source?: string
          fetched_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
