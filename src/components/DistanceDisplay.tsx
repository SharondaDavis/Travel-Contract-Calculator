import React, { useEffect, useState } from 'react';
import { calculateDistance, getSimulatedDistance } from '../services/geolocation';
import { QualificationSpectrum } from './distance-calculator/QualificationSpectrum';

interface DistanceDisplayProps {
  homeAddress: string;
  facilityLocation: string;
  facilityName: string;
  minQualifyingDistance?: number;
  agencyName?: string;
  onDistanceCalculated?: (distance: number, qualifies: boolean) => void;
}

// Common distance requirements by agency
const AGENCY_DISTANCE_REQUIREMENTS = {
  'AMN Healthcare': 50,
  'Cross Country Healthcare': 45,
  'Aya Healthcare': 50,
  'Trusted Health': 40,
  'Medical Solutions': 45,
  'FlexCare': 50,
  'Triage Staffing': 45,
  'TotalMed': 50,
  'Fusion Medical Staffing': 45,
  'Host Healthcare': 50,
  'Other': 45 // Default
};

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  homeAddress,
  facilityLocation,
  facilityName,
  minQualifyingDistance,
  agencyName = 'Other',
  onDistanceCalculated
}) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualifies, setQualifies] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string>(agencyName);
  const [customDistance, setCustomDistance] = useState<string>('');
  
  // Determine the qualifying distance based on agency or custom input
  const getQualifyingDistance = (): number => {
    if (minQualifyingDistance !== undefined) {
      return minQualifyingDistance;
    }
    
    if (selectedAgency === 'Custom' && customDistance) {
      return parseFloat(customDistance);
    }
    
    return AGENCY_DISTANCE_REQUIREMENTS[selectedAgency as keyof typeof AGENCY_DISTANCE_REQUIREMENTS] || 
           AGENCY_DISTANCE_REQUIREMENTS.Other;
  };

  useEffect(() => {
    // Reset distance when addresses change
    setDistance(null);
    setError(null);
  }, [homeAddress, facilityLocation]);

  const calculateDistanceNow = async () => {
    if (!homeAddress || !facilityLocation) {
      setError('Both home and facility addresses are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to calculate the actual distance
      const calculatedDistance = await calculateDistance(homeAddress, facilityLocation);
      setDistance(calculatedDistance);
      const qualifyingDistance = getQualifyingDistance();
      const doesQualify = calculatedDistance >= qualifyingDistance;
      setQualifies(doesQualify);
      
      // Notify parent component if callback provided
      if (onDistanceCalculated) {
        onDistanceCalculated(calculatedDistance, doesQualify);
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      
      try {
        // Fallback to simulated distance for demo purposes
        const simulatedDistance = await getSimulatedDistance(homeAddress, facilityLocation);
        setDistance(simulatedDistance);
        const qualifyingDistance = getQualifyingDistance();
        const doesQualify = simulatedDistance >= qualifyingDistance;
        setQualifies(doesQualify);
        
        // Notify parent component if callback provided
        if (onDistanceCalculated) {
          onDistanceCalculated(simulatedDistance, doesQualify);
        }
        
        setError('Using simulated distance (for demonstration)');
      } catch (simError) {
        setError('Unable to calculate distance. Please check addresses and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Distance Information</h3>
      
      {!homeAddress && (
        <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md mb-3">
          <p>Please set your home address in your profile to calculate distance.</p>
        </div>
      )}
      
      {homeAddress && facilityLocation && (
        <div className="mb-3">
          <p className="text-sm text-gray-500 mb-1">From: <span className="font-medium text-gray-700">{homeAddress}</span></p>
          <p className="text-sm text-gray-500 mb-1">To: <span className="font-medium text-gray-700">{facilityName || facilityLocation}</span></p>
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Travel Agency
        </label>
        <div className="flex gap-2">
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="flex-grow rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.keys(AGENCY_DISTANCE_REQUIREMENTS).map(agency => (
              <option key={agency} value={agency}>
                {agency} {agency !== 'Other' && agency !== 'Custom' ? 
                  `(${AGENCY_DISTANCE_REQUIREMENTS[agency as keyof typeof AGENCY_DISTANCE_REQUIREMENTS]} miles)` : 
                  ''}
              </option>
            ))}
            <option value="Custom">Custom Distance</option>
          </select>
          
          {selectedAgency === 'Custom' && (
            <div className="flex-shrink-0 w-24">
              <input
                type="number"
                value={customDistance}
                onChange={(e) => setCustomDistance(e.target.value)}
                min="0"
                step="1"
                placeholder="Miles"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Different agencies have different distance requirements for tax-free stipend qualification.
        </p>
      </div>
      
      {distance !== null && (
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span className="text-2xl font-bold text-blue-600">{distance.toFixed(1)}</span>
            <span className="ml-1 text-gray-500">miles</span>
            <span className={`ml-3 px-2 py-1 text-xs rounded-full ${qualifies ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {qualifies ? 'Qualifies' : 'Does not qualify'}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">
            Straight-line distance ("as the bird flies")
          </p>
          
          <QualificationSpectrum 
            distance={distance} 
            minDistance={getQualifyingDistance()} 
          />
          
          {error && (
            <p className="mt-2 text-xs text-amber-600">{error}</p>
          )}
          
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> {selectedAgency !== 'Custom' ? selectedAgency : 'This agency'} requires a minimum distance of <strong>{getQualifyingDistance()} miles</strong> to qualify for tax-free meal and housing stipends.
            </p>
          </div>
        </div>
      )}
      
      <div className="mt-3">
        <button
          onClick={calculateDistanceNow}
          disabled={loading || !homeAddress || !facilityLocation || (selectedAgency === 'Custom' && !customDistance)}
          className={`px-4 py-2 rounded-md text-white ${
            loading || !homeAddress || !facilityLocation || (selectedAgency === 'Custom' && !customDistance)
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          {loading ? 'Calculating...' : distance === null ? 'Calculate Distance' : 'Recalculate'}
        </button>
        
        {error && error !== 'Using simulated distance (for demonstration)' && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};
