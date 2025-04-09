import { useQuery } from '@tanstack/react-query';
import { fetchMarketInsights } from '../services/marketInsights';
import type { MarketInsight } from '../types/marketInsights';

/**
 * Hook to fetch and manage market insights data
 * @param location Location in format "City, STATE"
 * @param specialty Nursing specialty
 * @returns Query result with market insights data
 */
export function useMarketInsights(location: string, specialty: string) {
  return useQuery<MarketInsight>({
    queryKey: ['marketInsights', location, specialty],
    queryFn: () => fetchMarketInsights(location, specialty),
    enabled: Boolean(location && specialty),
    staleTime: 1000 * 60 * 30, // Consider data fresh for 30 minutes
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2, // Retry failed requests twice
  });
}
