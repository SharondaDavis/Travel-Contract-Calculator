import React, { useState } from 'react';
import { Brain, TrendingUp, DollarSign, Home, Receipt, Calendar, AlertCircle, CreditCard, Star } from 'lucide-react';
import { useMarketInsights } from '../hooks/useMarketInsights';
import type { Assignment } from '../App';
import { Button } from '@/components/ui/button';
import { runTaxServiceTests } from '@/services/taxService';

export const MarketInsights: React.FC<{ 
  assignment: Assignment;
  className?: string;
}> = ({ assignment, className = '' }) => {
  const { data: insights, isLoading, error } = useMarketInsights(
    assignment.location,
    assignment.specialty
  );

  const [testResults, setTestResults] = useState<Array<{name: string, status: string}>>([]);
  
  const handleRunTests = async () => {
    const results = await runTaxServiceTests();
    setTestResults(results);
  };

  // Loading state
  if (isLoading) {
    return (
      <section className={`bg-white rounded-xl shadow-sm p-6 border-2 border-blue-100 ${className || ''}`}>
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold">Market Insights</h3>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-32 bg-gray-100 rounded animate-pulse mt-4" />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className={`bg-white rounded-xl shadow-sm p-6 border-2 border-red-100 ${className || ''}`}>
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold">Market Insights Unavailable</h3>
        </div>
        <p className="text-gray-600 text-sm">
          We're having trouble fetching market data. Please try again later.
        </p>
      </section>
    );
  }

  // Show placeholder when no location/specialty is selected
  if (!assignment.location || !assignment.specialty) {
    return (
      <section className={`bg-white rounded-xl shadow-sm p-6 border-2 border-blue-100 ${className || ''}`}>
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold">Market Insights</h3>
        </div>
        <p className="text-gray-500 text-sm">
          Enter a location and specialty to see market insights and recommendations.
        </p>
      </section>
    );
  }

  // Handle the case where insights data is not available
  if (!insights) {
    return null;
  }

  // Helper function to determine color based on demand
  const getDemandColor = (demand: 'High' | 'Medium' | 'Low') => {
    switch (demand) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-blue-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Helper function to determine color based on trend
  const getTrendColor = (trend: 'Increasing' | 'Stable' | 'Decreasing') => {
    switch (trend) {
      case 'Increasing': return 'text-green-600';
      case 'Stable': return 'text-blue-600';
      case 'Decreasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <section className={`bg-white rounded-xl shadow-sm p-6 border-2 border-blue-100 ${className || ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Market Insights</h3>
          </div>
          <span className="text-sm text-gray-500">{insights.location}</span>
        </div>

        <div className="flex items-center gap-2 mb-4 group relative">
          <div className="flex items-center bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-8 h-8 ${star <= insights.contractRating ? 'text-amber-500 fill-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]' : 'text-gray-300 fill-gray-100'}`}
                />
              ))}
              <span className="ml-3 text-lg font-bold text-amber-700">
                {insights.contractRating.toFixed(1)}/5
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Rate comparison */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Rate Analysis</h4>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Market Rate</span>
              <div className="text-right">
                <span className="text-lg font-semibold text-blue-800">
                  ${insights.averageRate}/hr
                </span>
                {assignment.hourlyRate && (
                  <div className={`text-sm ${
                    parseFloat(assignment.hourlyRate) >= insights.averageRate
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}>
                    {parseFloat(assignment.hourlyRate) >= insights.averageRate
                      ? 'Above market'
                      : 'Below market'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tax impact - new section */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h4 className="font-medium text-emerald-800">Tax Impact</h4>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm text-gray-600">State Tax Rate</p>
                <p className="text-lg font-medium">
                  {insights.taxInfo.stateTaxRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Effective Rate</p>
                <p className="text-lg font-medium">
                  {insights.taxInfo.effectiveTaxRate}%
                </p>
              </div>
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-600">Est. Annual Tax</p>
              <p className="text-lg font-medium">
                {formatCurrency(insights.taxInfo.estimatedAnnualTax)}
              </p>
            </div>
            
            {insights.taxInfo.specialNotes && (
              <div className="p-2 bg-white rounded-md mt-2 border border-emerald-200">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Note:</span> {insights.taxInfo.specialNotes}
                </p>
              </div>
            )}
          </div>

          {/* Demand trends */}
          <div className="bg-gradient-to-r from-violet-50 to-violet-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h4 className="font-medium text-violet-800">Demand Analysis</h4>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm text-gray-600">Current Demand</p>
                <p className={`text-lg font-medium ${getDemandColor(insights.seasonalDemand.current)}`}>
                  {insights.seasonalDemand.current}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trend</p>
                <p className={`text-lg font-medium ${getTrendColor(insights.seasonalDemand.trend)}`}>
                  {insights.seasonalDemand.trend}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <p className="text-sm text-gray-600">
                Next peak season: <span className="font-medium text-violet-700">{insights.seasonalDemand.nextPeak}</span>
              </p>
            </div>
          </div>

          {/* Cost of living */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">Housing & Cost of Living</h4>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-sm text-gray-600">Cost Index</p>
                <p className={`text-lg font-medium ${insights.costOfLiving.index > 120 ? 'text-red-600' : insights.costOfLiving.index < 90 ? 'text-green-600' : 'text-amber-700'}`}>
                  {insights.costOfLiving.index}
                </p>
                <p className="text-xs text-gray-500">(US avg: 100)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Median Rent</p>
                <p className="text-lg font-medium text-amber-700">
                  {formatCurrency(insights.costOfLiving.medianRent)}/mo
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <p className="text-sm text-gray-600">
                Recommended stipend: <span className="font-medium text-amber-700">{formatCurrency(insights.costOfLiving.medianStipend)}/mo</span>
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-800 mb-3">Smart Recommendations</h4>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, index) => {
                // Choose icon based on recommendation type
                let Icon = AlertCircle;
                let color = 'text-gray-400';
                
                switch(rec.type) {
                  case 'rate':
                    Icon = DollarSign;
                    color = 'text-blue-400';
                    break;
                  case 'timing':
                    Icon = Calendar;
                    color = 'text-violet-400';
                    break;
                  case 'location':
                    Icon = Home;
                    color = 'text-amber-400';
                    break;
                  case 'tax':
                    Icon = Receipt;
                    color = 'text-emerald-400';
                    break;
                }
                
                return (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Icon className={`w-4 h-4 mt-0.5 ${color}`} />
                    <span>{rec.message}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-8 p-4 border rounded-lg">
        <Button 
          onClick={handleRunTests}
          variant="outline"
          className="mb-4"
        >
          Run Tax Service Tests
        </Button>
        
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            {testResults.map((test, index) => (
              <div key={index} className={`p-2 rounded ${test.status === 'passed' ? 'bg-green-100' : 'bg-red-100'}`}>
                {test.name}: {test.status}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
