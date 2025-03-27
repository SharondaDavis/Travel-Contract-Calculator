import React, { useEffect } from 'react';
import { Assignment } from '../types';
import { useRentalPrices } from '../hooks/useRentalPrices';

interface CostOfLivingFormProps {
  assignment: Assignment;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: string) => void;
}

export const CostOfLivingForm: React.FC<CostOfLivingFormProps> = ({ 
  assignment, 
  handleInputChange 
}) => {
  // Extract city and state from location (assuming format "City, State")
  const locationParts = assignment.location.split(',');
  const city = locationParts[0]?.trim() || '';
  const state = locationParts.length > 1 ? locationParts[1].trim() : '';
  
  // Get rental prices for the location
  const { data: rentalPrices, isLoading: isRentalPricesLoading } = useRentalPrices(city, state);
  
  // Auto-fill rental and utilities costs when data is available
  useEffect(() => {
    if (rentalPrices && !assignment.rentEstimate) {
      // Use one bedroom as default
      const rentEvent = {
        target: {
          name: 'rentEstimate',
          value: (rentalPrices.one_bedroom_avg / 4).toFixed(2) // Convert monthly to weekly
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleInputChange(rentEvent, assignment.id);
      
      // Also set utilities
      if (!assignment.utilitiesEstimate) {
        const utilitiesEvent = {
          target: {
            name: 'utilitiesEstimate',
            value: ((rentalPrices.utilities_avg + rentalPrices.internet_avg) / 4).toFixed(2) // Convert monthly to weekly
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        handleInputChange(utilitiesEvent, assignment.id);
      }
    }
  }, [rentalPrices, assignment.id, assignment.rentEstimate, assignment.utilitiesEstimate, handleInputChange]);

  return (
    <section className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        Cost of Living
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Rent/Housing
            {isRentalPricesLoading && <span className="ml-2 text-xs text-blue-500">(Loading local prices...)</span>}
          </label>
          <input
            type="number"
            name="rentEstimate"
            value={assignment.rentEstimate}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Utilities
          </label>
          <input
            type="number"
            name="utilitiesEstimate"
            value={assignment.utilitiesEstimate}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weekly Groceries
          </label>
          <input
            type="number"
            name="groceriesEstimate"
            value={assignment.groceriesEstimate}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>
    </section>
  );
};