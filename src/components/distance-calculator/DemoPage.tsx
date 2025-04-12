import React from 'react';
import { DistanceCalculator } from './DistanceCalculator';

export function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Travel Nurse Distance Calculator
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Calculate if your assignment meets the "as the bird flies" distance requirement
          </p>
        </div>
        
        <DistanceCalculator />
        
        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">About This Tool</h2>
          <p className="mb-4">
            This calculator helps travel nurses determine if a potential assignment meets their agency's distance requirements
            using the "as the bird flies" rule (straight-line distance).
          </p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">How It Works</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Enter your permanent residence address</li>
            <li>Enter the assignment location address</li>
            <li>Specify your agency's minimum distance requirement (typically 40-50 miles)</li>
            <li>Click "Calculate Distance" to see if the assignment qualifies</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-6 mb-2">Why This Matters</h3>
          <p>
            Many travel nursing agencies require assignments to be a minimum distance from your tax home to qualify for tax-free stipends.
            This tool helps you quickly check if an assignment meets those requirements before applying.
          </p>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This tool uses the Haversine formula to calculate the great-circle distance between two points on Earth.
              While this provides an accurate "as the bird flies" distance, agencies may use different methods to calculate distance.
              Always verify qualification requirements with your specific agency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
