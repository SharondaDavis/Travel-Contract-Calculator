export interface Assignment {
  id: string;
  facilityName: string;
  location: string;
  specialty: string;
  yearsOfExperience: string;
  shiftType: string;
  contractLength: string;
  startDate: string;
  hourlyRate: string;
  weeklyHours: string;
  housingStipend: string;
  mealsStipend: string;
  incidentalsStipend: string;
  housingExpenses: string;
  healthInsurance: string;
  transportationType: string;
  publicTransportCost: string;
  rideshareExpenses: string;
  parkingCost: string;
  commuteDistance: string;
  fuelCostPerGallon: string;
  vehicleMpg: string;
  rentEstimate: string;
  utilitiesEstimate: string;
  groceriesEstimate: string;
  travelExpenses: string;
  signOnBonus: string;
  completionBonus: string;
  plannedTimeOff: string[];
  seasonality: string;
}

export interface RatingDetail {
  positive: boolean;
  message: string;
}

export interface ComparisonData {
  id: string;
  name: string;
  weeklyIncome: number;
  weeklyStipends: number;
  weeklyExpenses: number;
  weeklyNet: number;
  totalValue: number;
  expenseBreakdown: Array<{
    name: string;
    value: number;
  }>;
}