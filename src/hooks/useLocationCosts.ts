import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface LocationCostData {
  housing_data: {
    median_rent: number;
    average_home_price: number;
    utilities: {
      electric: number;
      gas: number;
      water: number;
      internet: number;
    };
  };
  transportation_data: {
    public_transit: {
      monthly_pass: number;
      single_ticket: number;
    };
    fuel: {
      price_per_gallon: number;
      average_commute_miles: number;
    };
    rideshare: {
      average_mile_cost: number;
      base_fare: number;
    };
  };
  cost_of_living_index: number;
  tax_rate: number;
}

export function useLocationCosts(city: string, state: string) {
  return useQuery({
    queryKey: ['location_costs', city, state],
    queryFn: async (): Promise<LocationCostData> => {
      if (!city || !state) {
        throw new Error('City and state are required');
      }

      // First try to get data from Supabase
      const { data: existingData, error: dbError } = await supabase
        .from('location_data') // Changed from location_cost_data to location_data
        .select('*')
        .eq('city', city)
        .eq('state', state)
        .maybeSingle(); // Changed from single() to maybeSingle() to handle no results

      if (dbError) {
        throw dbError;
      }

      if (existingData) {
        return existingData as LocationCostData;
      }

      // If no data exists, trigger the edge function to fetch it
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cost-data?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch location cost data: ${errorText}`);
      }

      const data = await response.json();
      if (!data) {
        throw new Error('No data received from cost-data function');
      }

      return data as LocationCostData;
    },
    enabled: Boolean(city && state),
    staleTime: 1000 * 60 * 60, // Consider data fresh for 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2, // Retry failed requests twice
  });
}