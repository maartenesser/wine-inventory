-- Migration: Add locations feature
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add location_id to wines table
ALTER TABLE wines ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Add image_data column for storing base64 images (if image_url is used for external URLs)
ALTER TABLE wines ADD COLUMN IF NOT EXISTS image_data TEXT;

-- Create index for location lookups
CREATE INDEX IF NOT EXISTS idx_wines_location_id ON wines(location_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

-- Enable RLS on locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow all operations on locations (single-user app)
CREATE POLICY "Allow all operations on locations" ON locations FOR ALL USING (true);

-- Insert some default locations
INSERT INTO locations (name, description) VALUES
  ('Wine Cellar', 'Main wine cellar storage'),
  ('Kitchen Rack', 'Kitchen wine rack'),
  ('Living Room', 'Living room wine cabinet')
ON CONFLICT DO NOTHING;
