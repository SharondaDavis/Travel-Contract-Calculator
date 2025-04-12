import React, { useEffect, useState } from 'react';
import { calculateDistance, getSimulatedDistance } from '../services/geolocation';
import { QualificationSpectrum } from './distance-calculator/QualificationSpectrum';

interface DistanceDisplayProps {
  homeAddress: string;
  facilityLocation: string;
  facilityName: string;
  minQualifyingDistance?: number;
  onDistanceCalculated?: (distance: number, qualifies: boolean) => void;
}

export const DistanceDisplay: React.FC<DistanceDisplayProps> = ({
  homeAddress,
  facilityLocation,
  facilityName,
  minQualifyingDistance = 45, // Default minimum qualifying distance
  onDistanceCalculated
}) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualifies, setQualifies] = useState(false);

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
      const doesQualify = calculatedDistance >= minQualifyingDistance;
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
        const doesQualify = simulatedDistance >= minQualifyingDistance;
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
            minDistance={minQualifyingDistance} 
          />
          
          {error && (
            <p className="mt-2 text-xs text-amber-600">{error}</p>
          )}
        </div>
      )}
      
      <div className="mt-3">
        <button
          onClick={calculateDistanceNow}
          disabled={loading || !homeAddress || !facilityLocation}
          className={`px-4 py-2 rounded-md text-white ${
            loading || !homeAddress || !facilityLocation
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
