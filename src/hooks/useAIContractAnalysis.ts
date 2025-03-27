import { useQuery } from '@tanstack/react-query';

interface AIContractAnalysisResponse {
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  recommendations: string[];
  experienceBasedTips: string[];
  marketInsights: {
    averageRate: number;
    demandLevel: string; // 'high', 'medium', 'low'
    seasonalFactors: string;
    competitiveAnalysis: string;
  };
  negotiationTips: string[];
}

export function useAIContractAnalysis(contractData: {
  facilityName: string;
  location: string;
  specialty: string;
  yearsOfExperience: string;
  shiftType: string;
  contractLength: string;
  startDate: string;
  hourlyRate: string;
  weeklyHours: string;
  totalCompensation: string;
  plannedTimeOff: string[];
  seasonality: string;
  rentEstimate: string;
  fuelCostPerGallon: string;
}) {
  return useQuery({
    queryKey: ['ai_contract_analysis', contractData],
    queryFn: async (): Promise<AIContractAnalysisResponse> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-contract-analysis`,
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
        throw new Error('Failed to perform AI contract analysis');
      }

      return response.json();
    },
    enabled: Boolean(
      contractData.facilityName &&
      contractData.location &&
      contractData.specialty &&
      contractData.hourlyRate
    ),
    staleTime: 1000 * 60 * 60, // Consider data fresh for 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });
}