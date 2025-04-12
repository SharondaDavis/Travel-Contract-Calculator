import React, { useState } from 'react';
import { MapPin, Calculator } from 'lucide-react';
import { AddressInput } from './AddressInput';
import { DistanceDisplay } from './DistanceDisplay';
import { QualificationSpectrum } from './QualificationSpectrum';
import { calculateDistance, getSimulatedDistance } from '../../services/geolocation';

export function DistanceCalculator() {
  const [homeAddress, setHomeAddress] = useState('');
  const [assignmentAddress, setAssignmentAddress] = useState('');
  const [minDistance, setMinDistance] = useState(45);
  const [distance, setDistance] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSimulation, setUseSimulation] = useState(false);

  const handleCalculate = async () => {
    if (!homeAddress || !assignmentAddress) {
      setError('Please enter both addresses');
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      let calculatedDistance;
      
      if (useSimulation) {
        // Use simulation for demo purposes or when API is unavailable
        calculatedDistance = getSimulatedDistance(homeAddress, assignmentAddress);
      } else {
        // Use real geocoding API
        calculatedDistance = await calculateDistance(homeAddress, assignmentAddress);
      }
      
      setDistance(calculatedDistance);
    } catch (err) {
      setError('Error calculating distance. Please check addresses and try again.');
      console.error(err);
      
      // If real API fails, offer to use simulation
      if (!useSimulation) {
        setError('Error calculating distance. Would you like to use simulation mode instead?');
        // Add a button in the UI to enable simulation mode
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSimulationToggle = () => {
    setUseSimulation(!useSimulation);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Distance Calculator</h2>
        <div className="flex items-center">
          <label className="inline-flex items-center mr-4 cursor-pointer">
            <input
              type="checkbox"
              checked={useSimulation}
              onChange={handleSimulationToggle}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-700">
              Demo Mode
            </span>
          </label>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 mb-2">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Locations</span>
            </div>
            
            <AddressInput
              label="Home Address"
              value={homeAddress}
              onChange={setHomeAddress}
              placeholder="Enter your home address"
            />
            
            <AddressInput
              label="Assignment Address"
              value={assignmentAddress}
              onChange={setAssignmentAddress}
              placeholder="Enter the assignment address"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-gray-700 mb-2">
              <Calculator className="h-5 w-5" />
              <span className="font-medium">Calculation Settings</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Required Distance (miles)
              </label>
              <input
                type="number"
                value={minDistance}
                onChange={(e) => setMinDistance(Number(e.target.value))}
                className="w-full p-2 border rounded-lg"
                min={0}
                max={100}
              />
              <p className="mt-1 text-sm text-gray-500">
                Your agency's minimum required distance (typically 40-50 miles)
              </p>
            </div>
            
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors mt-4"
            >
              {isCalculating ? 'Calculating...' : 'Calculate Distance'}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
            {error.includes('simulation') && (
              <button
                onClick={handleSimulationToggle}
                className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
              >
                Enable Demo Mode
              </button>
            )}
          </div>
        )}
        
        {distance !== null && (
          <div className="space-y-6 mt-4">
            <DistanceDisplay distance={distance} minDistance={minDistance} />
            <QualificationSpectrum distance={distance} minDistance={minDistance} />
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-2">What does this mean?</h3>
              <p className="text-blue-700">
                {distance >= minDistance 
                  ? `This assignment is ${(distance - minDistance).toFixed(1)} miles beyond your agency's minimum distance requirement of ${minDistance} miles. It qualifies as a travel assignment under the "as the bird flies" rule.`
                  : `This assignment is ${(minDistance - distance).toFixed(1)} miles short of your agency's minimum distance requirement of ${minDistance} miles. It does not qualify as a travel assignment under the "as the bird flies" rule.`
                }
              </p>
            </div>
            
            {useSimulation && (
              <div className="text-center text-sm text-gray-500 italic">
                Note: This is a demo calculation. In production, actual geocoding will be used.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
