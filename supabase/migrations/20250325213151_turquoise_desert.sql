/*
  # Enhanced Cost Data Schema

  1. Updates
    - Add detailed housing and transportation data structures
    - Add data validation constraints
    - Add more detailed tracking of data sources

  2. Security
    - Maintains existing RLS policies
*/

ALTER TABLE location_cost_data
DROP COLUMN IF EXISTS avg_housing_cost,
DROP COLUMN IF EXISTS avg_utilities_cost,
DROP COLUMN IF EXISTS avg_transportation_cost;

ALTER TABLE location_cost_data
ADD COLUMN IF NOT EXISTS housing_data jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS transportation_data jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD CONSTRAINT valid_housing_data CHECK (
  jsonb_typeof(housing_data) = 'object' AND
  housing_data ? 'median_rent' AND
  housing_data ? 'average_home_price' AND
  housing_data ? 'utilities'
),
ADD CONSTRAINT valid_transportation_data CHECK (
  jsonb_typeof(transportation_data) = 'object' AND
  transportation_data ? 'public_transit' AND
  transportation_data ? 'fuel' AND
  transportation_data ? 'rideshare'
);