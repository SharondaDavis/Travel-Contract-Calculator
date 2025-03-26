/*
  # Update location data schema and policies

  1. Changes
    - Rename location_cost_data table to location_data if it exists
    - Create location_data table with updated schema
    - Add data validation constraints
    - Set up RLS policies
*/

-- Rename table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_cost_data') THEN
    ALTER TABLE location_cost_data RENAME TO location_data;
  END IF;
END $$;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS location_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  housing_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  transportation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  tax_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_of_living_index float,
  data_source text,
  last_api_update timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city, state),
  CONSTRAINT valid_housing_data CHECK (
    jsonb_typeof(housing_data) = 'object' AND
    housing_data ? 'median_rent' AND
    housing_data ? 'average_home_price' AND
    housing_data ? 'utilities'
  ),
  CONSTRAINT valid_transportation_data CHECK (
    jsonb_typeof(transportation_data) = 'object' AND
    transportation_data ? 'public_transit' AND
    transportation_data ? 'fuel' AND
    transportation_data ? 'rideshare'
  ),
  CONSTRAINT valid_tax_data CHECK (
    jsonb_typeof(tax_data) = 'object' AND
    tax_data ? 'rate' AND
    tax_data ? 'brackets'
  )
);

-- Enable RLS
ALTER TABLE location_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read access" ON location_data;
  DROP POLICY IF EXISTS "Allow service role to insert/update" ON location_data;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Add policies
CREATE POLICY "Allow public read access"
  ON location_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to insert/update"
  ON location_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);