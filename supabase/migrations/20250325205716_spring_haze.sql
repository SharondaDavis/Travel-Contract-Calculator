/*
  # Travel Nurse Contract Analysis Schema

  1. New Tables
    - `agencies`
      - Stores agency information and metadata
    - `contract_listings`
      - Stores raw contract listings from agencies
    - `predicted_facilities`
      - Stores facility predictions based on historical data
    - `location_cost_data`
      - Stores cost of living data for locations
  
  2. Security
    - Enable RLS on all tables
    - Allow public read access
    - Restrict writes to authenticated users
*/

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

-- Contract listings table
CREATE TABLE IF NOT EXISTS contract_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id),
  specialty text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  weekly_pay numeric(10,2) NOT NULL,
  shift_type text,
  contract_length int,
  posted_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_contract_length CHECK (contract_length > 0)
);

-- Predicted facilities table
CREATE TABLE IF NOT EXISTS predicted_facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES contract_listings(id),
  facility_name text NOT NULL,
  confidence_score float NOT NULL,
  historical_avg_rate numeric(10,2),
  common_shift_type text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 100)
);

-- Location cost data table
CREATE TABLE IF NOT EXISTS location_cost_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  state text NOT NULL,
  cost_of_living_index float,
  avg_housing_cost numeric(10,2),
  avg_utilities_cost numeric(10,2),
  avg_transportation_cost numeric(10,2),
  tax_rate float,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city, state)
);

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicted_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_cost_data ENABLE ROW LEVEL SECURITY;

-- Policies for agencies
CREATE POLICY "Allow public read access on agencies"
  ON agencies
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for contract_listings
CREATE POLICY "Allow public read access on contract_listings"
  ON contract_listings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert contract_listings"
  ON contract_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for predicted_facilities
CREATE POLICY "Allow public read access on predicted_facilities"
  ON predicted_facilities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert predicted_facilities"
  ON predicted_facilities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for location_cost_data
CREATE POLICY "Allow public read access on location_cost_data"
  ON location_cost_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to insert/update location_cost_data"
  ON location_cost_data
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to predict facilities based on contract listing
CREATE OR REPLACE FUNCTION predict_facilities(
  p_listing_id uuid
)
RETURNS TABLE (
  facility_name text,
  confidence_score float,
  historical_avg_rate numeric,
  common_shift_type text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH listing_info AS (
    SELECT 
      cl.city,
      cl.state,
      cl.specialty,
      a.name as agency_name
    FROM contract_listings cl
    JOIN agencies a ON cl.agency_id = a.id
    WHERE cl.id = p_listing_id
  ),
  historical_data AS (
    SELECT
      cl2.id,
      pf.facility_name,
      COUNT(*) as listing_count,
      AVG(cl2.weekly_pay) as avg_weekly_pay,
      MODE() WITHIN GROUP (ORDER BY cl2.shift_type) as typical_shift
    FROM contract_listings cl2
    JOIN predicted_facilities pf ON cl2.id = pf.listing_id
    JOIN listing_info li ON 
      cl2.city = li.city AND 
      cl2.state = li.state AND 
      cl2.specialty = li.specialty
    GROUP BY cl2.id, pf.facility_name
  )
  SELECT
    hd.facility_name,
    (hd.listing_count::float / (SELECT MAX(listing_count) FROM historical_data)) * 100 as confidence,
    hd.avg_weekly_pay,
    hd.typical_shift
  FROM historical_data hd
  ORDER BY confidence DESC
  LIMIT 5;
END;
$$;