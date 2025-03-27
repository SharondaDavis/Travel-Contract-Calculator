import React from 'react';
import { Assignment } from '../types';

interface FacilityDetailsFormProps {
  assignment: Assignment;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: string) => void;
}

export const FacilityDetailsForm: React.FC<FacilityDetailsFormProps> = ({ 
  assignment, 
  handleInputChange 
}) => {
  return (
    <section className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        Facility Details
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facility Name
          </label>
          <input
            type="text"
            name="facilityName"
            value={assignment.facilityName}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter facility name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={assignment.location}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="City, State"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specialty
          </label>
          <input
            type="text"
            name="specialty"
            value={assignment.specialty}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., ICU, Med-Surg, ER"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Years of Experience in Specialty
          </label>
          <input
            type="number"
            name="yearsOfExperience"
            value={assignment.yearsOfExperience}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="0"
            min="0"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shift Type
          </label>
          <select
            name="shiftType"
            value={assignment.shiftType}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select shift type</option>
            <option value="days">Days</option>
            <option value="nights">Nights</option>
            <option value="rotating">Rotating</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Length (weeks)
          </label>
          <input
            type="number"
            name="contractLength"
            value={assignment.contractLength}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="13"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={assignment.startDate}
            onChange={(e) => handleInputChange(e, assignment.id)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </section>
  );
};