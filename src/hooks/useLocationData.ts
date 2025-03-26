import { useQuery } from '@tanstack/react-query';
import { fetchLocationData } from '../services/api';

export function useLocationData(city: string, state: string) {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ['location_data', city, state],
    queryFn: () => fetchLocationData(city, state),
    enabled: Boolean(city && state),
  });

  return {
    ...data,
    isLoading,
    error,
  };
}