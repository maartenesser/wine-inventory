-- Migration: Add enhanced wine details columns
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add winemaker/producer information
ALTER TABLE wines ADD COLUMN IF NOT EXISTS winemaker_info TEXT;

-- Add drinking window (e.g., "2024-2030")
ALTER TABLE wines ADD COLUMN IF NOT EXISTS drinking_window TEXT;

-- Note: food_pairing and tasting_notes columns should already exist
-- If they don't, uncomment these:
-- ALTER TABLE wines ADD COLUMN IF NOT EXISTS food_pairing JSONB;
-- ALTER TABLE wines ADD COLUMN IF NOT EXISTS tasting_notes TEXT;
