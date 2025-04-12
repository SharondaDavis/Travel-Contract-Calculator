import React from 'react';

interface QualificationSpectrumProps {
  distance: number;
  minDistance: number;
}

export function QualificationSpectrum({ distance, minDistance }: QualificationSpectrumProps) {
  // Define thresholds for qualification zones
  const redThreshold = minDistance * 0.95; // 95% of minimum distance
  const yellowThreshold = minDistance * 1.05; // 105% of minimum distance
  
  // Determine qualification status
  let status: 'red' | 'yellow' | 'green';
  let message: string;
  
  if (distance < redThreshold) {
    status = 'red';
    message = 'Does not qualify - Below minimum distance';
  } else if (distance < yellowThreshold) {
    status = 'yellow';
    message = 'Borderline qualification - Very close to minimum';
  } else {
    status = 'green';
    message = 'Qualifies - Above minimum distance';
  }

  // Calculate the position of the indicator as a percentage
  const maxDisplayDistance = minDistance * 1.5; // Show up to 150% of min distance
  const position = Math.min(Math.max(distance / maxDisplayDistance, 0), 1) * 100;
  
  return (
    <div className="space-y-3">
      <div className="text-lg font-medium">{message}</div>
      
      <div className="relative h-10">
        {/* Red zone */}
        <div className="absolute left-0 top-0 h-full w-1/3 bg-red-500 rounded-l-full" />
        
        {/* Yellow zone */}
        <div className="absolute left-1/3 top-0 h-full w-1/3 bg-yellow-500" />
        
        {/* Green zone */}
        <div className="absolute left-2/3 top-0 h-full w-1/3 bg-green-500 rounded-r-full" />
        
        {/* Position indicator */}
        <div 
          className="absolute top-0 h-full w-4 bg-white border-2 border-gray-800 rounded-full transform -translate-x-1/2 transition-all duration-500 ease-in-out"
          style={{ left: `${position}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm text-gray-600">
        <span>0 miles</span>
        <span>{minDistance} miles</span>
        <span>{Math.round(minDistance * 1.5)} miles</span>
      </div>
    </div>
  );
}
