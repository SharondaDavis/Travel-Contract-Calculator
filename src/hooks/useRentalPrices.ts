import { useQuery } from '@tanstack/react-query';

interface RentalPricesResponse {
  studio_avg: number;
  one_bedroom_avg: number;
  two_bedroom_avg: number;
  utilities_avg: number;
  internet_avg: number;
}

export function useRentalPrices(city: string, state: string) {
  return useQuery({
    queryKey: ['rental_prices', city, state],
    queryFn: async (): Promise<RentalPricesResponse> => {
      // Return mock data for now to ensure the app works without API
      return {
        studio_avg: 1200,
        one_bedroom_avg: 1500,
        two_bedroom_avg: 1800,
        utilities_avg: 150,
        internet_avg: 60
      };
    },
    enabled: Boolean(city && state),
  });
}