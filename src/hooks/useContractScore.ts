import { useQuery } from '@tanstack/react-query';

interface ContractScoreResponse {
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  recommendations: string[];
}

export function useContractScore(contractData: {
  facilityName: string;
  location: string;
  specialty: string;
  shiftType: string;
  contractLength: string;
  startDate: string;
  hourlyRate: string;
  weeklyHours: string;
  totalCompensation: string;
  plannedTimeOff: string[];
  seasonality: string;
}) {
  return useQuery({
    queryKey: ['contract_score', contractData],
    queryFn: async (): Promise<ContractScoreResponse> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contract-score`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ contractData }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to calculate contract score');
      }

      return response.json();
    },
    enabled: Boolean(
      contractData.facilityName &&
      contractData.location &&
      contractData.hourlyRate
    ),
  });
}