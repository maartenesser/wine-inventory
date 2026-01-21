-- Migration: Add Authentication and Row Level Security
-- Description: Add user_id columns to tables and enable RLS

-- ============================================
-- Step 1: Add user_id columns
-- ============================================

-- Add user_id to wines table
ALTER TABLE wines
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to locations table
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- Step 2: Create default user for existing data (optional)
-- This creates a placeholder user for existing wines
-- You may want to assign them to a real user instead
-- ============================================

-- Uncomment below if you want to assign existing data to a specific user:
-- UPDATE wines SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;
-- UPDATE locations SET user_id = 'YOUR_USER_UUID_HERE' WHERE user_id IS NULL;

-- ============================================
-- Step 3: Enable Row Level Security
-- ============================================

-- Enable RLS on wines table
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

-- Enable RLS on locations table
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 4: Create RLS Policies for wines
-- ============================================

-- Policy: Users can view their own wines
CREATE POLICY "Users can view own wines"
ON wines FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own wines
CREATE POLICY "Users can insert own wines"
ON wines FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own wines
CREATE POLICY "Users can update own wines"
ON wines FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own wines
CREATE POLICY "Users can delete own wines"
ON wines FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Step 5: Create RLS Policies for locations
-- ============================================

-- Policy: Users can view their own locations
CREATE POLICY "Users can view own locations"
ON locations FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own locations
CREATE POLICY "Users can insert own locations"
ON locations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own locations
CREATE POLICY "Users can update own locations"
ON locations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own locations
CREATE POLICY "Users can delete own locations"
ON locations FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- Step 6: Create indexes for better query performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wines_user_id ON wines(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);

-- ============================================
-- Step 7: Make user_id NOT NULL after migration
-- IMPORTANT: Run this only after assigning user_ids to all existing rows
-- ============================================

-- Uncomment after migrating existing data:
-- ALTER TABLE wines ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE locations ALTER COLUMN user_id SET NOT NULL;
