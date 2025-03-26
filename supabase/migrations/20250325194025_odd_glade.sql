/*
  # Create location data table

  1. New Tables
    - `location_data`
      - `id` (uuid, primary key)
      - `city` (text)
      - `state` (text)
      - `housing_data` (jsonb)
      - `transportation_data` (jsonb)
      - `tax_data` (jsonb)
      - `updated_at` (timestamptz)
      - Unique constraint on city,state combination

  2. Security
    - Enable RLS on `location_data` table
    - Add policy for authenticated users to read data
    - Add policy for service role to insert/update data
*/

CREATE TABLE IF NOT EXISTS location_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  housing_data jsonb NOT NULL,
  transportation_data jsonb NOT NULL,
  tax_data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city, state)
);

ALTER TABLE location_data ENABLE ROW LEVEL SECURITY;

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