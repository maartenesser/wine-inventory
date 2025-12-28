-- Migration: Add bottle_size column and update color constraint
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add bottle_size column with default value 'standard'
ALTER TABLE wines ADD COLUMN IF NOT EXISTS bottle_size TEXT DEFAULT 'standard';

-- Update color constraint to include champagne and dessert wine types
-- First, drop the existing constraint
ALTER TABLE wines DROP CONSTRAINT IF EXISTS wines_color_check;

-- Add new constraint with expanded wine types
ALTER TABLE wines ADD CONSTRAINT wines_color_check
  CHECK (color IN ('red', 'white', 'rosé', 'sparkling', 'champagne', 'dessert'));
