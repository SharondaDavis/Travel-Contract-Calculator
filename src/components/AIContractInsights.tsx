import React from 'react';
import { Assignment } from '../types';
import { useAIContractAnalysis } from '../hooks/useAIContractAnalysis';
import { Lightbulb, TrendingUp, DollarSign, Award, Clock } from 'lucide-react';

interface AIContractInsightsProps {
  assignment: Assignment;
  calculateNetIncome: (assignment: Assignment) => string;
  calculateTotalContractValue: (assignment: Assignment) => string;
}

export const AIContractInsights: React.FC<AIContractInsightsProps> = ({ 
  assignment,
  calculateNetIncome,
  calculateTotalContractValue
}) => {
  // Extract city and state from location (assuming format "City, State")
  const locationParts = assignment.location.split(',');
  const city = locationParts[0]?.trim() || '';
  const state = locationParts.length > 1 ? locationParts[1].trim() : '';
  
  const { data: aiAnalysis, isLoading, error } = useAIContractAnalysis({
    facilityName: assignment.facilityName,
    location: assignment.location,
    specialty: assignment.specialty,
    yearsOfExperience: assignment.yearsOfExperience,
    shiftType: assignment.shiftType,
    contractLength: assignment.contractLength,
    startDate: assignment.startDate,
    hourlyRate: assignment.hourlyRate,
    weeklyHours: assignment.weeklyHours,
    totalCompensation: calculateTotalContractValue(assignment),
    plannedTimeOff: assignment.plannedTimeOff,
    seasonality: assignment.seasonality,
    rentEstimate: assignment.rentEstimate,
    fuelCostPerGallon: assignment.fuelCostPerGallon
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          AI Contract Insights
        </h2>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !aiAnalysis) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          AI Contract Insights
        </h2>
        <p className="text-gray-600">
          {error ? 'Error loading AI insights. Please try again later.' : 'Complete the contract details to get AI-powered insights.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Lightbulb className="w-5 h-5" />
        AI Contract Insights
      </h2>

      <div className="space-y-6">
        {/* Market Insights */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Market Insights
          </h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Average Rate:</span> ${aiAnalysis.marketInsights.averageRate.toFixed(2)}/hr</p>
            <p><span className="font-medium">Demand Level:</span> {aiAnalysis.marketInsights.demandLevel}</p>
            <p><span className="font-medium">Seasonal Factors:</span> {aiAnalysis.marketInsights.seasonalFactors}</p>
            <p><span className="font-medium">Competitive Analysis:</span> {aiAnalysis.marketInsights.competitiveAnalysis}</p>
          </div>
        </div>

        {/* Experience-Based Tips */}
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" />
            Experience-Based Tips ({assignment.yearsOfExperience || '0'} years)
          </h3>
          <ul className="space-y-1 text-sm">
            {aiAnalysis.experienceBasedTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negotiation Tips */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            Negotiation Tips
          </h3>
          <ul className="space-y-1 text-sm">
            {aiAnalysis.negotiationTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-600 mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-md font-medium mb-3">Pros</h3>
            <ul className="space-y-1 text-sm">
              {aiAnalysis.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="text-md font-medium mb-3">Cons</h3>
            <ul className="space-y-1 text-sm">
              {aiAnalysis.cons.map((con, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-amber-50 rounded-lg p-4">
          <h3 className="text-md font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Recommendations
          </h3>
          <ul className="space-y-1 text-sm">
            {aiAnalysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};