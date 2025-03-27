import { useQuery } from '@tanstack/react-query';

interface AIContractAnalysisParams {
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
}

export interface AIContractAnalysisResponse {
  marketInsights: {
    averageRate: number;
    demandLevel: string;
    seasonalFactors: string;
    competitiveAnalysis: string;
  };
  experienceBasedTips: string[];
  negotiationTips: string[];
  pros: string[];
  cons: string[];
  recommendations: string[];
}

export function useAIContractAnalysis(params: AIContractAnalysisParams) {
  return useQuery({
    queryKey: ['ai_contract_analysis', params],
    queryFn: async (): Promise<AIContractAnalysisResponse> => {
      // For now, return mock data to ensure the app works without API
      return {
        marketInsights: {
          averageRate: parseFloat(params.hourlyRate) || 45.00,
          demandLevel: "High",
          seasonalFactors: "Summer typically sees increased demand for travel nurses",
          competitiveAnalysis: "This rate is competitive for your experience level"
        },
        experienceBasedTips: [
          "With your experience level, you can negotiate for better compensation",
          "Consider asking for additional training opportunities",
          "Your specialty is in high demand, leverage this in negotiations"
        ],
        negotiationTips: [
          "Ask for a higher hourly rate based on your experience",
          "Request guaranteed hours to ensure stable income",
          "Negotiate for better housing stipend based on local costs"
        ],
        pros: [
          "Competitive hourly rate",
          "Good location with reasonable cost of living",
          "Opportunity to gain valuable experience"
        ],
        cons: [
          "Housing costs may be higher than stipend covers",
          "Consider transportation costs in your budget",
          "Check if the facility has adequate staffing"
        ],
        recommendations: [
          "This contract appears to be a good match for your experience level",
          "Consider negotiating for a slightly higher hourly rate",
          "Research housing options in advance to maximize your stipend"
        ]
      };
    },
    enabled: Boolean(
      params.facilityName &&
      params.location &&
      params.hourlyRate
    ),
  });
}