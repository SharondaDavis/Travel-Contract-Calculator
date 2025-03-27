import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface FuelPriceData {
  state: string;
  regular: number;
  midgrade: number;
  premium: number;
  diesel: number;
  last_updated: string;
}

export function useFuelPrices(state: string) {
  return useQuery({
    queryKey: ['fuel_prices', state],
    queryFn: async (): Promise<FuelPriceData> => {
      if (!state) {
        throw new Error('State is required');
      }

      // First try to get data from Supabase
      const { data: existingData, error: dbError } = await supabase
        .from('fuel_prices')
        .select('*')
        .eq('state', state)
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      if (existingData) {
        return existingData as FuelPriceData;
      }

      // If no data exists, trigger the edge function to fetch it
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fuel-prices?state=${encodeURIComponent(state)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch fuel price data: ${errorText}`);
      }

      const data = await response.json();
      if (!data) {
        throw new Error('No data received from fuel-prices function');
      }

      return data as FuelPriceData;
    },
    enabled: Boolean(state),
    staleTime: 1000 * 60 * 60 * 24, // Consider data fresh for 24 hours
    cacheTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    retry: 2, // Retry failed requests twice
  });
}