import React from 'react';

interface DistanceDisplayProps {
  distance: number;
  minDistance: number;
}

export function DistanceDisplay({ distance, minDistance }: DistanceDisplayProps) {
  // Determine if the distance qualifies
  const qualifies = distance >= minDistance;
  
  // Calculate the difference
  const difference = distance - minDistance;
  const differenceText = difference >= 0 
    ? `${difference.toFixed(1)} miles above minimum` 
    : `${Math.abs(difference).toFixed(1)} miles below minimum`;
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Distance Calculation</h3>
          <p className="text-3xl font-bold mt-1">{distance.toFixed(1)} miles</p>
          <p className="text-sm text-gray-600 mt-1">
            {differenceText}
          </p>
        </div>
        
        <div className={`text-center px-4 py-2 rounded-full ${
          qualifies ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <span className="font-medium">
            {qualifies ? 'Qualifies' : 'Does Not Qualify'}
          </span>
        </div>
      </div>
    </div>
  );
}
