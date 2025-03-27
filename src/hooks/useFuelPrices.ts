import { useQuery } from '@tanstack/react-query';

interface FuelPricesResponse {
  regular: number;
  midgrade: number;
  premium: number;
  diesel: number;
}

export function useFuelPrices(state: string) {
  return useQuery({
    queryKey: ['fuel_prices', state],
    queryFn: async (): Promise<FuelPricesResponse> => {
      // Return mock data for now to ensure the app works without API
      return {
        regular: 3.50,
        midgrade: 3.80,
        premium: 4.10,
        diesel: 3.90
      };
    },
    enabled: Boolean(state),
  });
}