import { useQuery } from '@tanstack/react-query';
import { getLikelyFacilities } from '../services/contractHistory';

export function useFacilityPredictions(
  city: string,
  state: string,
  specialty: string,
  agencyName: string
) {
  return useQuery({
    queryKey: ['facility_predictions', city, state, specialty, agencyName],
    queryFn: () => getLikelyFacilities(city, state, specialty, agencyName),
    enabled: Boolean(city && state && specialty && agencyName),
  });
}