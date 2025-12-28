-- Wine Inventory Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wines table
CREATE TABLE IF NOT EXISTS wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chateau TEXT NOT NULL,
  wine_name TEXT,
  vintage INTEGER,
  region TEXT,
  appellation TEXT,
  country TEXT,
  grape_variety TEXT,
  color TEXT CHECK (color IN ('red', 'white', 'rosé', 'sparkling')),
  alcohol_pct DECIMAL(4,1),
  quantity INTEGER DEFAULT 1,
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  price_avg DECIMAL(10,2),
  price_source TEXT CHECK (price_source IN ('wine-searcher', 'vivino', 'google', 'manual')),
  currency TEXT DEFAULT 'EUR',
  image_url TEXT,
  food_pairing JSONB,
  tasting_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price history table (optional, for tracking price changes over time)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_wines_chateau ON wines(chateau);
CREATE INDEX IF NOT EXISTS idx_wines_region ON wines(region);
CREATE INDEX IF NOT EXISTS idx_wines_vintage ON wines(vintage);
CREATE INDEX IF NOT EXISTS idx_wines_created_at ON wines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_wine_id ON price_history(wine_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_wines_updated_at ON wines;
CREATE TRIGGER update_wines_updated_at
  BEFORE UPDATE ON wines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - optional for single-user app
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single-user app, no auth)
CREATE POLICY "Allow all operations on wines" ON wines FOR ALL USING (true);
CREATE POLICY "Allow all operations on price_history" ON price_history FOR ALL USING (true);
