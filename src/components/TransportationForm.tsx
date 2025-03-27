import React, { useEffect } from 'react';
import { Assignment } from '../types';
import { useFuelPrices } from '../hooks/useFuelPrices';

interface TransportationFormProps {
  assignment: Assignment;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: string) => void;
}

export const TransportationForm: React.FC<TransportationFormProps> = ({ 
  assignment, 
  handleInputChange 
}) => {
  // Extract state from location (assuming format "City, State")
  const locationParts = assignment.location.split(',');
  const state = locationParts.length > 1 ? locationParts[1].trim() : '';
  
  // Get fuel prices for the state
  const { data: fuelPrices, isLoading: isFuelPricesLoading } = useFuelPrices(state);
  
  // Auto-fill fuel cost when data is available
  useEffect(() => {
    if (fuelPrices && !assignment.fuelCostPerGallon && assignment.transportationType === 'personal') {
      const fuelEvent = {
        target: {
          name: 'fuelCostPerGallon',
          value: fuelPrices.regular.toFixed(2)
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleInputChange(fuelEvent, assignment.id);
    }
  }, [fuelPrices, assignment.id, assignment.fuelCostPerGallon, assignment.transportationType, handleInputChange]);

  return (
    <section className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        Transportation
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transportation Type
          </label>
          <select
            name="transportationType"
            value={assignment.transportationType}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="public">Public Transportation</option>
            <option value="rideshare">Rideshare (Uber/Lyft)</option>
            <option value="personal">Personal Vehicle</option>
          </select>
        </div>

        {assignment.transportationType === 'public' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Public Transport Cost
            </label>
            <input
              type="number"
              name="publicTransportCost"
              value={assignment.publicTransportCost}
              onChange={(e) => handleInputChange(e, assignment.id)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        )}

        {assignment.transportationType === 'rideshare' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Rideshare Expenses
            </label>
            <input
              type="number"
              name="rideshareExpenses"
              value={assignment.rideshareExpenses}
              onChange={(e) => handleInputChange(e, assignment.id)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        )}

        {assignment.transportationType === 'personal' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commute Distance (miles one way)
              </label>
              <input
                type="number"
                name="commuteDistance"
                value={assignment.commuteDistance}
                onChange={(e) => handleInputChange(e, assignment.id)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel Cost per Gallon
                {isFuelPricesLoading && <span className="ml-2 text-xs text-blue-500">(Loading local prices...)</span>}
              </label>
              <input
                type="number"
                name="fuelCostPerGallon"
                value={assignment.fuelCostPerGallon}
                onChange={(e) => handleInputChange(e, assignment.id)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle MPG
              </label>
              <input
                type="number"
                name="vehicleMpg"
                value={assignment.vehicleMpg}
                onChange={(e) => handleInputChange(e, assignment.id)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Parking Cost
              </label>
              <input
                type="number"
                name="parkingCost"
                value={assignment.parkingCost}
                onChange={(e) => handleInputChange(e, assignment.id)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};