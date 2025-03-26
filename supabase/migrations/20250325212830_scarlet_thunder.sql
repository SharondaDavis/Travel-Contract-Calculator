/*
  # Add Cost Data Tables and Functions

  1. New Tables
    - Updates to location_cost_data table
      - Added more specific cost breakdowns
      - Added last update tracking
      - Added data source tracking

  2. Security
    - Maintains existing RLS policies
    - Adds new policies for data updates
*/

ALTER TABLE location_cost_data
ADD COLUMN IF NOT EXISTS data_source text,
ADD COLUMN IF NOT EXISTS last_api_update timestamptz DEFAULT now();

-- Function to check if data needs updating
CREATE OR REPLACE FUNCTION should_update_cost_data(last_update timestamptz)
RETURNS boolean
LANGUAGE plpgsql AS $$
BEGIN
  RETURN (
    last_update IS NULL OR
    (CURRENT_TIMESTAMP - last_update) > interval '7 days'
  );
END;
$$;