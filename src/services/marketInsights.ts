import axios from 'axios';
import { MarketInsight } from '../types/marketInsights';
import { getStateTaxRates } from './taxService';

// Helper to determine demand levels based on specialty and date
export function determineDemand(specialty: string, date: Date): 'High' | 'Medium' | 'Low' {
  const month = date.getMonth();
  // Simplified demand model based on specialty and season
  const demandMap: {[key: string]: {[key: number]: 'High' | 'Medium' | 'Low'}} = {
    'ICU': {
      0: 'Medium', 1: 'Medium', 2: 'Medium', // Jan-Mar
      3: 'High', 4: 'High', 5: 'High',        // Apr-Jun
      6: 'Medium', 7: 'Medium', 8: 'Low',     // Jul-Sep
      9: 'Low', 10: 'Medium', 11: 'Medium'    // Oct-Dec
    },
    'ER': {
      0: 'High', 1: 'High', 2: 'Medium',     // Jan-Mar
      3: 'Medium', 4: 'Low', 5: 'Low',        // Apr-Jun
      6: 'Medium', 7: 'Medium', 8: 'High',    // Jul-Sep
      9: 'High', 10: 'High', 11: 'High'       // Oct-Dec
    },
    // Default pattern if specialty not found
    'default': {
      0: 'Medium', 1: 'Medium', 2: 'Medium', // Jan-Mar
      3: 'Medium', 4: 'Medium', 5: 'High',    // Apr-Jun
      6: 'High', 7: 'High', 8: 'Medium',      // Jul-Sep
      9: 'Medium', 10: 'Medium', 11: 'Medium' // Oct-Dec
    }
  };
  
  const specialtyMap = demandMap[specialty] || demandMap['default'];
  return specialtyMap[month];
}

// Helper to determine demand trend
export /**
 * Calculate state's rank in terms of nursing pay (1-50)
 * 1 = highest paying, 50 = lowest paying
 */
function calculateStateRank(state: string, rate: number): number {
  // State rankings based on average travel nursing pay
  // This would ideally come from a real API with current data
  const stateRankings: {[key: string]: number} = {
    'CA': 1,  // California typically has highest rates
    'NY': 3,
    'MA': 4,
    'NJ': 5,
    'WA': 6,
    'OR': 8,
    'NV': 10,
    'CO': 11,
    'AK': 2,  // Alaska often has very high rates
    'HI': 7,  // Hawaii has high cost of living
    'IL': 13,
    'CT': 12,
    'RI': 15,
    'PA': 18,
    'MD': 14,
    'DC': 9,
    'FL': 22,
    'TX': 23,
    'AZ': 25,
    'GA': 27,
    'NC': 30,
    'OH': 33,
    'MI': 29,
    'MO': 35,
    'AL': 38,
    'MS': 42,
    'SD': 44,
    'ND': 40,
    'MT': 32,
    'ID': 36
    // Other states would be included in a real implementation
  };
  
  return stateRankings[state] || Math.round(25 + (Math.random() * 10 - 5)); // Random value around 25 if state not found
}

/**
 * Calculate rate adjusted for cost of living
 * This gives a better comparison between different locations
 */
function calculateAdjustedRate(rate: number, costIndex: number): number {
  // Formula: rate * (100 / costIndex)
  // This adjusts the rate as if cost of living was at national average (100)
  return Math.round(rate * (100 / costIndex));
}

/**
 * Calculate where this rate falls in the national percentile
 * 90 = top 10% of rates, 50 = median rate, 10 = bottom 10% of rates
 */
function calculateNationalPercentile(specialty: string, rate: number): number {
  // This would ideally use real data from a nursing salary database
  // For now, we'll use some rough estimations
  
  // Approximate ranges for different specialties (25th-75th percentile)
  const specialtyRanges: {[key: string]: {low: number, median: number, high: number}} = {
    'ICU': { low: 45, median: 55, high: 65 },
    'ER': { low: 42, median: 52, high: 62 },
    'Med-Surg': { low: 38, median: 48, high: 58 },
    'PICU': { low: 48, median: 58, high: 68 },
    'NICU': { low: 46, median: 56, high: 66 },
    'OR': { low: 43, median: 53, high: 63 },
    'L&D': { low: 41, median: 51, high: 61 }
  };
  
  // Get range for this specialty or use default
  const range = specialtyRanges[specialty] || { low: 40, median: 50, high: 60 };
  
  // Calculate percentile based on where rate falls in range
  if (rate <= range.low) {
    // Below 25th percentile
    return Math.round(25 * (rate / range.low));
  } else if (rate <= range.median) {
    // Between 25th and 50th percentile
    return Math.round(25 + 25 * ((rate - range.low) / (range.median - range.low)));
  } else if (rate <= range.high) {
    // Between 50th and 75th percentile
    return Math.round(50 + 25 * ((rate - range.median) / (range.high - range.median)));
  } else {
    // Above 75th percentile
    return Math.round(75 + 25 * Math.min(1, (rate - range.high) / (range.high * 0.2)));
  }
}

function determineTrend(specialty: string, date: Date): 'Increasing' | 'Stable' | 'Decreasing' {
  const month = date.getMonth();
  const nextMonth = (month + 1) % 12;
  
  const specialtyMap = {
    'ICU': {
      0: 'Stable', 1: 'Increasing', 2: 'Increasing', // Jan-Mar
      3: 'Stable', 4: 'Stable', 5: 'Decreasing',    // Apr-Jun
      6: 'Decreasing', 7: 'Decreasing', 8: 'Stable', // Jul-Sep
      9: 'Increasing', 10: 'Increasing', 11: 'Stable'// Oct-Dec
    },
    'ER': {
      0: 'Stable', 1: 'Decreasing', 2: 'Decreasing', // Jan-Mar
      3: 'Decreasing', 4: 'Stable', 5: 'Increasing',  // Apr-Jun
      6: 'Increasing', 7: 'Increasing', 8: 'Stable',  // Jul-Sep
      9: 'Stable', 10: 'Decreasing', 11: 'Decreasing' // Oct-Dec
    },
    // Default pattern
    'default': {
      0: 'Stable', 1: 'Increasing', 2: 'Increasing', // Jan-Mar
      3: 'Stable', 4: 'Stable', 5: 'Decreasing',     // Apr-Jun
      6: 'Decreasing', 7: 'Stable', 8: 'Increasing',  // Jul-Sep
      9: 'Increasing', 10: 'Stable', 11: 'Stable'     // Oct-Dec
    }
  } as {[key: string]: {[key: number]: 'Increasing' | 'Stable' | 'Decreasing'}};
  
  const demandMap = specialtyMap[specialty] || specialtyMap['default'];
  return demandMap[month];
}

// Helper to determine next peak demand season
export function determineNextPeak(specialty: string, date: Date): string {
  const currentMonth = date.getMonth();
  const peakMonths: {[key: string]: number[]} = {
    'ICU': [3, 4, 5], // Apr-Jun
    'ER': [0, 1, 8, 9, 10, 11], // Jan-Feb, Sep-Dec
    'default': [5, 6, 7] // Jun-Aug
  };
  
  const peaks = peakMonths[specialty] || peakMonths['default'];
  const nextPeaks = peaks.filter(month => month > currentMonth);
  
  if (nextPeaks.length === 0) {
    // If no peaks left this year, get the first peak of next year
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[peaks[0]];
  }
  
  const nextPeak = nextPeaks[0];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[nextPeak];
}

// Calculate recommended stipend based on median rent
export function calculateRecommendedStipend(medianRent: number): number {
  // Stipend typically covers housing plus a buffer for utilities and expenses
  return Math.round(medianRent * 1.3); // 30% buffer for utilities and incidentals
}

// Generate recommendations based on market data
export function generateRecommendations(
  location: string,
  specialty: string,
  averageRate: number,
  currentRate: number = 0,
  taxInfo: any,
  costOfLiving: any
): Array<{type: 'rate' | 'timing' | 'location' | 'tax'; message: string}> {
  const recommendations: Array<{type: 'rate' | 'timing' | 'location' | 'tax'; message: string}> = [];
  
  // Rate recommendations
  if (currentRate && currentRate < averageRate * 0.9) {
    recommendations.push({
      type: 'rate',
      message: `Consider negotiating for a higher rate. Market average is $${averageRate}/hr.`
    });
  } else if (currentRate && currentRate > averageRate * 1.1) {
    recommendations.push({
      type: 'rate',
      message: `Your rate is above market average. This is an excellent contract financially.`
    });
  }
  
  // Tax recommendations
  if (taxInfo.stateTaxRate > 7) {
    recommendations.push({
      type: 'tax',
      message: `This state has high income tax (${taxInfo.stateTaxRate}%). Consider tax-advantaged retirement contributions.`
    });
  } else if (taxInfo.stateTaxRate === 0) {
    recommendations.push({
      type: 'tax',
      message: `This state has no income tax, which maximizes your take-home pay.`
    });
  }
  
  // Cost of living recommendations
  if (costOfLiving.index > 120) {
    recommendations.push({
      type: 'location',
      message: `This area has a high cost of living. Ensure your stipends cover expenses adequately.`
    });
  }
  
  // Ensure we have at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'timing',
      message: `Market conditions for ${specialty} in ${location} are currently average. Consider timing contracts with peak seasons.`
    });
  }
  
  return recommendations;
}

// The main function to fetch market insights
export async function fetchMarketInsights(location: string, specialty: string, hourlyRate?: string): Promise<MarketInsight> {
  if (!location || !specialty) {
    throw new Error('Location and specialty are required');
  }
  
  // Parse state from location (assuming format "City, STATE")
  const state = location.split(', ')[1] || '';
  const city = location.split(', ')[0] || '';
  
  try {
    // Fetch average rates for the specialty and location
    // In a real app, this would call your backend or a rate API
    const averageRate = await fetchAverageRate(specialty, state);
    
    // Get tax information for the state
    const annualSalary = averageRate * 40 * 52; // Estimated annual income
    const taxInfo = await getStateTaxRates(state, annualSalary);
    
    // Get cost of living data
    const costOfLiving = await fetchCostOfLiving(city, state);
    
    // Calculate contract rating (1-5 scale)
    const ratingFactors = {
      rateRatio: hourlyRate ? parseFloat(hourlyRate) / averageRate : 1,
      costIndex: costOfLiving.index / 100,
      demandScore: getDemandScore(determineDemand(specialty, new Date())),
      taxImpact: 1 - (taxInfo.effectiveTaxRate / 100)
    };

    const rawRating = 
      (ratingFactors.rateRatio * 0.4) + 
      (ratingFactors.costIndex * 0.2) + 
      (ratingFactors.demandScore * 0.2) + 
      (ratingFactors.taxImpact * 0.2);

    // Normalize to 1-5 scale
    const contractRating = Math.min(5, Math.max(1, rawRating * 3));

    // Create the market insight object
    const marketInsight: MarketInsight = {
      location,
      specialty,
      averageRate,
      seasonalDemand: {
        current: determineDemand(specialty, new Date()),
        trend: determineTrend(specialty, new Date()),
        nextPeak: determineNextPeak(specialty, new Date())
      },
      costOfLiving: {
        index: costOfLiving.index,
        medianRent: costOfLiving.medianRent,
        medianStipend: calculateRecommendedStipend(costOfLiving.medianRent)
      },
      taxInfo: {
        stateTaxRate: taxInfo.stateTaxRate,
        taxBrackets: taxInfo.taxBrackets,
        effectiveTaxRate: taxInfo.effectiveTaxRate,
        estimatedAnnualTax: taxInfo.estimatedAnnualTax,
        specialNotes: taxInfo.specialNotes,
        federalTaxRate: taxInfo.federalTaxRate,
        deductions: taxInfo.deductions
      },
      salaryComparison: {
        stateRank: calculateStateRank(state, averageRate),
        adjustedRate: calculateAdjustedRate(averageRate, costOfLiving.index),
        nationalPercentile: calculateNationalPercentile(specialty, averageRate)
      },
      recommendations: generateRecommendations(
        location,
        specialty,
        averageRate,
        hourlyRate ? parseFloat(hourlyRate) : 0, // Current rate (would be passed from your application state)
        taxInfo,
        costOfLiving
      ),
      contractRating
    };
    
    return marketInsight;
  } catch (error) {
    console.error('Error fetching market insights:', error);
    return getFallbackMarketInsight(location, specialty);
  }
}

function getDemandScore(demand: string): number {
  switch(demand.toLowerCase()) {
    case 'high': return 1.1;
    case 'medium': return 1.0;
    case 'low': return 0.9;
    default: return 1.0;
  }
}

// Helper function to fetch average rates
async function fetchAverageRate(specialty: string, state: string): Promise<number> {
  try {
    // In a real app, this would be an API call to your backend
    // For now, we'll use a simulated data set
    const specialtyRates: {[key: string]: number} = {
      'ICU': 55,
      'ER': 52,
      'Med-Surg': 48,
      'PICU': 58,
      'NICU': 56,
      'OR': 53,
      'L&D': 51
    };
    
    const stateMultipliers: {[key: string]: number} = {
      'CA': 1.4,
      'NY': 1.3,
      'TX': 0.9,
      'FL': 0.95,
      'OH': 0.85,
      'WA': 1.2,
      'OR': 1.15,
      'CO': 1.1,
      'AZ': 0.9,
      'NC': 0.9
    };
    
    const baseRate = specialtyRates[specialty] || 50; // Default rate if specialty not found
    const multiplier = stateMultipliers[state] || 1; // Default multiplier if state not found
    
    return Math.round(baseRate * multiplier);
  } catch (error) {
    console.error('Error fetching average rate:', error);
    return 50; // Default fallback rate
  }
}

// Helper function to fetch cost of living data
async function fetchCostOfLiving(city: string, state: string): Promise<{index: number; medianRent: number}> {
  try {
    // Import the housing service
    const { getHousingData } = await import('./housingService');
    const housingData = await getHousingData(city, state);
    
    return {
      index: housingData.costIndex,
      medianRent: housingData.medianRent
    };
  } catch (error) {
    console.error('Error fetching cost of living data:', error);
    return { index: 100, medianRent: 1500 }; // National average as fallback
  }
}

// Fallback market insight when API calls fail
function getFallbackMarketInsight(location: string, specialty: string): MarketInsight {
  return {
    location,
    specialty,
    averageRate: 50, // Default average rate
    seasonalDemand: {
      current: 'Medium' as 'High' | 'Medium' | 'Low',
      trend: 'Stable' as 'Increasing' | 'Stable' | 'Decreasing',
      nextPeak: 'June'
    },
    costOfLiving: {
      index: 100, // National average
      medianRent: 1500, // National average
      medianStipend: 1950 // 30% above rent
    },
    taxInfo: {
      stateTaxRate: 5, // Default rate
      taxBrackets: [
        { min: 0, rate: 5 }
      ],
      effectiveTaxRate: 5,
      estimatedAnnualTax: 5200, // 5% of 50*40*52
      specialNotes: 'Using estimated tax rates - could not fetch live data',
      federalTaxRate: 12, // Default federal rate
      deductions: [
        { type: 'Standard Deduction', amount: 12950 },
        { type: 'Estimated Healthcare', amount: 2500 }
      ]
    },
    salaryComparison: {
      stateRank: 25, // Middle of pack (1-50)
      adjustedRate: 50, // Same as nominal since index = 100
      nationalPercentile: 50 // Median percentile
    },
    recommendations: [
      {
        type: 'rate',
        message: `Market data unavailable. Consider researching ${specialty} rates in ${location} before negotiating.`
      }
    ],
    contractRating: 3
  };
}
