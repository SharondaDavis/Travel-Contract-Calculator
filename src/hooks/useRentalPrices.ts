import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface RentalPriceData {
  city: string;
  state: string;
  studio_avg: number;
  one_bedroom_avg: number;
  two_bedroom_avg: number;
  three_bedroom_avg: number;
  utilities_avg: number;
  internet_avg: number;
  last_updated: string;
}

export function useRentalPrices(city: string, state: string) {
  return useQuery({
    queryKey: ['rental_prices', city, state],
    queryFn: async (): Promise<RentalPriceData> => {
      if (!city || !state) {
        throw new Error('City and state are required');
      }

      // First try to get data from Supabase
      const { data: existingData, error: dbError } = await supabase
        .from('rental_prices')
        .select('*')
        .eq('city', city)
        .eq('state', state)
        .maybeSingle();

      if (dbError) {
        throw dbError;
      }

      if (existingData) {
        return existingData as RentalPriceData;
      }

      // If no data exists, trigger the edge function to fetch it
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rental-prices?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch rental price data: ${errorText}`);
      }

      const data = await response.json();
      if (!data) {
        throw new Error('No data received from rental-prices function');
      }

      return data as RentalPriceData;
    },
    enabled: Boolean(city && state),
    staleTime: 1000 * 60 * 60 * 24 * 7, // Consider data fresh for 7 days
    cacheTime: 1000 * 60 * 60 * 24 * 30, // Keep in cache for 30 days
    retry: 2, // Retry failed requests twice
  });
}