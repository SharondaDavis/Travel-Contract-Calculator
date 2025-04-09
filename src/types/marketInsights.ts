export interface MarketInsight {
  location: string;
  specialty: string;
  averageRate: number;
  seasonalDemand: {
    current: string;
    trend: string;
    nextPeak: string;
  };
  costOfLiving: {
    index: number;
    medianRent: number;
    medianStipend: number;
  };
  taxInfo: {
    stateTaxRate: number;
    taxBrackets: Array<{
      min: number;
      max?: number;
      rate: number;
    }>;
    effectiveTaxRate: number; // Calculated based on income level
    estimatedAnnualTax: number;
    specialNotes?: string; // For states with special tax considerations
    federalTaxRate: number;
    deductions: Array<{
      type: string;
      amount: number;
    }>;
  };
  salaryComparison: {
    stateRank: number; // State's rank in RN pay (1-50)
    adjustedRate: number; // Rate adjusted for cost of living
    nationalPercentile: number; // Where this rate falls nationally
  };
  recommendations: Array<{
    type: 'rate' | 'timing' | 'location' | 'tax';
    message: string;
  }>;
  contractRating: number;
}
