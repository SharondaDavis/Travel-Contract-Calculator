/*
  # Contract History Analysis Schema

  1. New Tables
    - `contract_history`
      - Stores historical contract data
      - Links locations with facilities and agencies
    - `facilities`
      - Stores known healthcare facilities
      - Includes verification status and metadata
  
  2. Security
    - Enable RLS on both tables
    - Allow public read access
    - Restrict writes to authenticated users
*/

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  facility_type text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, city, state)
);

-- Contract history table
CREATE TABLE IF NOT EXISTS contract_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name text NOT NULL,
  specialty text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  facility_id uuid REFERENCES facilities(id),
  shift_type text,
  contract_length int,
  hourly_rate numeric(10,2),
  posted_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_contract_length CHECK (contract_length > 0)
);

-- Enable RLS
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;

-- Policies for facilities
CREATE POLICY "Allow public read access on facilities"
  ON facilities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert facilities"
  ON facilities
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for contract_history
CREATE POLICY "Allow public read access on contract_history"
  ON contract_history
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert contract_history"
  ON contract_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Functions for analysis
CREATE OR REPLACE FUNCTION get_likely_facilities(
  p_city text,
  p_state text,
  p_specialty text,
  p_agency_name text
)
RETURNS TABLE (
  facility_id uuid,
  facility_name text,
  confidence_score float,
  contract_count bigint,
  avg_hourly_rate numeric,
  common_shift_type text
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH facility_stats AS (
    SELECT
      f.id,
      f.name,
      COUNT(*) as contract_count,
      AVG(ch.hourly_rate) as avg_rate,
      MODE() WITHIN GROUP (ORDER BY ch.shift_type) as typical_shift
    FROM facilities f
    JOIN contract_history ch ON f.id = ch.facility_id
    WHERE 
      f.city = p_city 
      AND f.state = p_state
      AND ch.specialty = p_specialty
      AND ch.agency_name = p_agency_name
    GROUP BY f.id, f.name
  )
  SELECT
    fs.id,
    fs.name,
    (fs.contract_count::float / (SELECT MAX(contract_count) FROM facility_stats)) * 100 as confidence,
    fs.contract_count,
    fs.avg_rate,
    fs.typical_shift
  FROM facility_stats fs
  ORDER BY confidence DESC;
END;
$$;