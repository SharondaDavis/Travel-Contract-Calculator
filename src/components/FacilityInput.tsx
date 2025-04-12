import React from 'react';
import { AddressInput, AddressSuggestionMetadata } from './distance-calculator/AddressInput';
import { DistanceDisplay } from './DistanceDisplay';

interface FacilityInputProps {
  facilityName: string;
  location: string;
  onFacilityChange: (facilityName: string, location: string) => void;
  id: string;
  fieldValidation: { [key: string]: boolean };
  homeAddress: string;
  onDistanceCalculated?: (distance: number, qualifies: boolean) => void;
  showDistanceDisplay?: boolean;
}

export const FacilityInput: React.FC<FacilityInputProps> = ({
  facilityName,
  location,
  onFacilityChange,
  id,
  fieldValidation,
  homeAddress,
  onDistanceCalculated,
  showDistanceDisplay = true
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Facility Name & Location
      </label>
      <AddressInput
        label=""
        value={location}
        onChange={(value, metadata) => {
          // Update location
          const locationValue = value;
          
          // Update facility name if metadata is provided
          const facilityNameValue = metadata?.facility_name || facilityName;
          
          // Call the combined handler
          onFacilityChange(facilityNameValue, locationValue);
        }}
        placeholder="Search for facility name or address"
        includeFacilities={true}
        returnMetadata={true}
      />
      {fieldValidation[`${id}-location`] && (
        <div className="text-green-500 mt-1">
          <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="ml-2">Valid</span>
        </div>
      )}
      
      {facilityName && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md">
          <p className="text-sm font-medium text-blue-700">Selected Facility: {facilityName}</p>
        </div>
      )}

      {/* Distance Display */}
      {showDistanceDisplay && location && (
        <DistanceDisplay
          homeAddress={homeAddress}
          facilityLocation={location}
          facilityName={facilityName}
          onDistanceCalculated={onDistanceCalculated}
        />
      )}
    </div>
  );
};
