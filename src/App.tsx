import React, { useState, useCallback, useMemo } from 'react';
import { Calculator, CheckCircle, AlertCircle, Star, Trash2, Plus } from 'lucide-react';
import { useContractScore } from './hooks/useContractScore';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tab } from '@headlessui/react';

interface Assignment {
  id: string;
  facilityName: string;
  location: string;
  specialty: string;
  shiftType: string;
  contractLength: string;
  startDate: string;
  hourlyRate: string;
  weeklyHours: string;
  housingStipend: string;
  mealsStipend: string;
  incidentalsStipend: string;
  housingExpenses: string;
  healthInsurance: string;
  transportationType: string;
  publicTransportCost: string;
  rideshareExpenses: string;
  parkingCost: string;
  commuteDistance: string;
  fuelCostPerGallon: string;
  vehicleMpg: string;
  rentEstimate: string;
  utilitiesEstimate: string;
  groceriesEstimate: string;
  travelExpenses: string;
  signOnBonus: string;
  completionBonus: string;
  plannedTimeOff: string[];
  seasonality: string;
}

const initialAssignment: Assignment = {
  id: '1',
  facilityName: '',
  location: '',
  specialty: '',
  shiftType: '',
  contractLength: '',
  startDate: '',
  hourlyRate: '',
  weeklyHours: '36',
  housingStipend: '',
  mealsStipend: '',
  incidentalsStipend: '',
  housingExpenses: '',
  healthInsurance: '',
  transportationType: 'public',
  publicTransportCost: '',
  rideshareExpenses: '',
  parkingCost: '',
  commuteDistance: '',
  fuelCostPerGallon: '',
  vehicleMpg: '25',
  rentEstimate: '',
  utilitiesEstimate: '',
  groceriesEstimate: '',
  travelExpenses: '',
  signOnBonus: '',
  completionBonus: '',
  plannedTimeOff: [],
  seasonality: 'summer'
};

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>([initialAssignment]);
  const [activeAssignment, setActiveAssignment] = useState<string>('1');
  const [view, setView] = useState<'details' | 'comparison'>('details');

  // Track field validation
  const [fieldValidation, setFieldValidation] = useState<{ [key: string]: boolean }>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, id: string) => {
    const { name, value } = e.target;
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id ? { ...assignment, [name]: value } : assignment
    ));
    // Mark field as validated
    setFieldValidation(prev => ({
      ...prev,
      [`${id}-${name}`]: value.trim() !== ''
    }));
  }, []);

  const addNewAssignment = () => {
    const newId = (assignments.length + 1).toString();
    setAssignments(prev => [...prev, { ...initialAssignment, id: newId }]);
    setActiveAssignment(newId);
  };

  const calculateTaxableIncome = (assignment: Assignment) => {
    const hourlyRate = parseFloat(assignment.hourlyRate) || 0;
    const weeklyHours = parseFloat(assignment.weeklyHours) || 0;
    return hourlyRate * weeklyHours;
  };

  const calculateNonTaxableIncome = (assignment: Assignment) => {
    const housing = parseFloat(assignment.housingStipend) || 0;
    const meals = parseFloat(assignment.mealsStipend) || 0;
    const incidentals = parseFloat(assignment.incidentalsStipend) || 0;
    return housing + meals + incidentals;
  };

  const calculateTransportationExpenses = (assignment: Assignment) => {
    const publicTransport = parseFloat(assignment.publicTransportCost) || 0;
    const rideshare = parseFloat(assignment.rideshareExpenses) || 0;
    const parking = parseFloat(assignment.parkingCost) || 0;
    const distance = parseFloat(assignment.commuteDistance) || 0;
    const fuelCostPerGallon = parseFloat(assignment.fuelCostPerGallon) || 0;
    const mpg = parseFloat(assignment.vehicleMpg) || 25;
    
    // Calculate fuel expenses based on distance, MPG, and cost per gallon (assuming 5 work days)
    // Formula: (distance * 2 * 5 * fuelCostPerGallon) / MPG
    const weeklyFuelExpense = ((distance * 2 * 5) / mpg) * fuelCostPerGallon;
    
    return publicTransport + rideshare + parking + weeklyFuelExpense;
  };

  const calculateLivingExpenses = (assignment: Assignment) => {
    const rent = parseFloat(assignment.rentEstimate) || 0;
    const utilities = parseFloat(assignment.utilitiesEstimate) || 0;
    const groceries = parseFloat(assignment.groceriesEstimate) || 0;
    return rent + utilities + groceries;
  };

  const calculateExpenses = (assignment: Assignment) => {
    const housing = parseFloat(assignment.housingExpenses) || 0;
    const health = parseFloat(assignment.healthInsurance) || 0;
    const travel = parseFloat(assignment.travelExpenses) || 0;
    const transportation = calculateTransportationExpenses(assignment);
    const living = calculateLivingExpenses(assignment);
    return housing + health + travel + transportation + living;
  };

  const calculateTotalBonuses = (assignment: Assignment) => {
    const signOn = parseFloat(assignment.signOnBonus) || 0;
    const completion = parseFloat(assignment.completionBonus) || 0;
    return signOn + completion;
  };

  const calculateNetIncome = (assignment: Assignment) => {
    const taxableIncome = calculateTaxableIncome(assignment);
    const nonTaxableIncome = calculateNonTaxableIncome(assignment);
    const expenses = calculateExpenses(assignment);
    const weeklyBonuses = calculateTotalBonuses(assignment) / (parseFloat(assignment.contractLength) || 13);
    
    // Simplified tax calculation (30% of taxable income)
    const estimatedTax = taxableIncome * 0.3;
    
    return (taxableIncome - estimatedTax + nonTaxableIncome - expenses + weeklyBonuses).toFixed(2);
  };

  const calculateTotalContractValue = (assignment: Assignment) => {
    const weeklyNet = parseFloat(calculateNetIncome(assignment));
    const weeks = parseFloat(assignment.contractLength) || 13;
    const bonuses = calculateTotalBonuses(assignment);
    return (weeklyNet * weeks + bonuses).toFixed(2);
  };

  const taxableRatio = (assignment: Assignment) => {
    const taxable = calculateTaxableIncome(assignment);
    const nonTaxable = calculateNonTaxableIncome(assignment);
    const total = taxable + nonTaxable;
    return total ? ((taxable / total) * 100).toFixed(1) : '0';
  };

  const getAssignmentMetrics = useCallback((assignment: Assignment) => {
    const weeklyIncome = calculateTaxableIncome(assignment);
    const weeklyStipends = calculateNonTaxableIncome(assignment);
    const weeklyExpenses = calculateExpenses(assignment);
    const weeklyNet = parseFloat(calculateNetIncome(assignment));
    const totalValue = parseFloat(calculateTotalContractValue(assignment));
    
    return {
      weeklyIncome,
      weeklyStipends,
      weeklyExpenses,
      weeklyNet,
      totalValue,
      expenseBreakdown: [
        { name: 'Housing', value: parseFloat(assignment.housingExpenses) || 0 },
        { name: 'Transportation', value: calculateTransportationExpenses(assignment) },
        { name: 'Healthcare', value: parseFloat(assignment.healthInsurance) || 0 },
        { name: 'Food & Utilities', value: (parseFloat(assignment.utilitiesEstimate) || 0) + (parseFloat(assignment.groceriesEstimate) || 0) },
        { name: 'Travel', value: parseFloat(assignment.travelExpenses) || 0 }
      ]
    };
  }, []);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return assignments.map(assignment => ({
      id: assignment.id,
      name: assignment.facilityName || `Contract ${assignment.id}`,
      ...getAssignmentMetrics(assignment)
    }));
  }, [assignments, getAssignmentMetrics]);

  const getRatingScore = (assignment: Assignment) => {
    const totalValue = parseFloat(calculateTotalContractValue(assignment));
    const weeklyNet = parseFloat(calculateNetIncome(assignment));
    const expenses = calculateExpenses(assignment);
    
    // Calculate base score from 1-5
    let score = 1; // Start with minimum score
    
    // Add points based on contract value
    if (totalValue > 100000) score += 2;
    else if (totalValue > 50000) score += 1;
    
    // Add points based on weekly net income
    if (weeklyNet > 2000) score += 2;
    else if (weeklyNet > 1000) score += 1;
    
    // Subtract points for high expenses
    if (expenses > 1000) score -= 1;
    
    // Ensure score stays within 1-5 range
    return Math.max(1, Math.min(5, score));
  };

  const getRatingDetails = (assignment: Assignment) => {
    const details: { positive: boolean; message: string }[] = [];
    if (parseFloat(calculateTotalContractValue(assignment)) > 50000) {
      details.push({ positive: true, message: 'High total contract value' });
    } else {
      details.push({ positive: false, message: 'Low total contract value' });
    }
    if (parseFloat(calculateNetIncome(assignment)) > 1000) {
      details.push({ positive: true, message: 'High weekly net income' });
    } else {
      details.push({ positive: false, message: 'Low weekly net income' });
    }
    if (calculateExpenses(assignment) < 500) {
      details.push({ positive: true, message: 'Low expenses' });
    } else {
      details.push({ positive: false, message: 'High expenses' });
    }
    return details;
  };

  const handleDeleteAssignment = (id: string) => {
    if (assignments.length > 1) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      if (activeAssignment === id) {
        setActiveAssignment(assignments[0].id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Travel Contract Calculator</h1>
          </div>
          <div className="flex justify-center gap-4 mb-4">
            <a href="https://github.com/sharondadavis/travel-contract-calculator" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/github/stars/sharondadavis/travel-contract-calculator?logo=github&style=for-the-badge" alt="GitHub stars" />
            </a>
            <a href="https://github.com/sharondadavis/travel-contract-calculator" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/github/forks/sharondadavis/travel-contract-calculator?logo=github&style=for-the-badge" alt="GitHub forks" />
            </a>
            <a href="https://github.com/sharondadavis/travel-contract-calculator" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/github/contributors/sharondadavis/travel-contract-calculator?logo=github&style=for-the-badge" alt="GitHub contributors" />
            </a>
          </div>
          <p className="text-gray-600">Compare different travel contracts to make informed decisions</p>
        </header>

        {/* View Toggle */}
        <div className="mb-6">
          <Tab.Group selectedIndex={view === 'details' ? 0 : 1} onChange={(index) => setView(index === 0 ? 'details' : 'comparison')}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                 ${selected ? 'bg-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
              }>
                Contract Details
              </Tab>
              <Tab className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                 ${selected ? 'bg-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`
              }>
                Compare Contracts
              </Tab>
            </Tab.List>
          </Tab.Group>
        </div>

        {/* Contract Navigation */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {assignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => setActiveAssignment(assignment.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                activeAssignment === assignment.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } shadow-sm transition-colors duration-200`}
            >
              {assignment.facilityName || `Contract ${assignment.id}`}
              {assignments.length > 1 && (
                <Trash2
                  className="w-4 h-4 text-red-500 hover:text-red-600 cursor-pointer"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleDeleteAssignment(assignment.id);
                  }}
                />
              )}
            </button>
          ))}
          <button
            onClick={addNewAssignment}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 shadow-sm transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Contract
          </button>
        </div>

        {view === 'details' ? (
          // Contract Details View
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {assignments.map((assignment) => (
              assignment.id === activeAssignment && (
                <div key={assignment.id} className="space-y-6">
                  {/* Existing contract details form */}
                  <div className="grid md:grid-cols-2 gap-8">
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="Enter facility name"
                          />
                          {fieldValidation[`${assignment.id}-facilityName`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="City, State"
                          />
                          {fieldValidation[`${assignment.id}-location`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="e.g., ICU, Med-Surg, ER"
                          />
                          {fieldValidation[`${assignment.id}-specialty`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shift Type
                          </label>
                          <select
                            name="shiftType"
                            value={assignment.shiftType}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                          >
                            <option value="">Select shift type</option>
                            <option value="days">Days</option>
                            <option value="nights">Nights</option>
                            <option value="rotating">Rotating</option>
                          </select>
                          {fieldValidation[`${assignment.id}-shiftType`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="13"
                          />
                          {fieldValidation[`${assignment.id}-contractLength`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                          />
                          {fieldValidation[`${assignment.id}-startDate`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="bg-white rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Compensation
                      </h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hourly Rate (Taxable)
                          </label>
                          <input
                            type="number"
                            name="hourlyRate"
                            value={assignment.hourlyRate}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                          {fieldValidation[`${assignment.id}-hourlyRate`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weekly Hours
                          </label>
                          <input
                            type="number"
                            name="weeklyHours"
                            value={assignment.weeklyHours}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="36"
                          />
                          {fieldValidation[`${assignment.id}-weeklyHours`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Stipends (Non-taxable)</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Housing Stipend</label>
                              <input
                                type="number"
                                name="housingStipend"
                                value={assignment.housingStipend}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-housingStipend`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Meals Stipend</label>
                              <input
                                type="number"
                                name="mealsStipend"
                                value={assignment.mealsStipend}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-mealsStipend`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Incidentals Stipend</label>
                              <input
                                type="number"
                                name="incidentalsStipend"
                                value={assignment.incidentalsStipend}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-incidentalsStipend`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Bonuses</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Sign-on Bonus</label>
                              <input
                                type="number"
                                name="signOnBonus"
                                value={assignment.signOnBonus}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-signOnBonus`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Completion Bonus</label>
                              <input
                                type="number"
                                name="completionBonus"
                                value={assignment.completionBonus}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-completionBonus`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                          >
                            <option value="public">Public Transportation</option>
                            <option value="rideshare">Rideshare (Uber/Lyft)</option>
                            <option value="personal">Personal Vehicle</option>
                          </select>
                          {fieldValidation[`${assignment.id}-transportationType`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                              className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                              placeholder="0.00"
                            />
                            {fieldValidation[`${assignment.id}-publicTransportCost`] && (
                              <div className="text-green-500 mt-1">
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-2">Valid</span>
                              </div>
                            )}
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
                              className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                              placeholder="0.00"
                            />
                            {fieldValidation[`${assignment.id}-rideshareExpenses`] && (
                              <div className="text-green-500 mt-1">
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-2">Valid</span>
                              </div>
                            )}
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
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-commuteDistance`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fuel Cost Per Gallon
                              </label>
                              <input
                                type="number"
                                name="fuelCostPerGallon"
                                value={assignment.fuelCostPerGallon}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-fuelCostPerGallon`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
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
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="25"
                              />
                              {fieldValidation[`${assignment.id}-vehicleMpg`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
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
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                              {fieldValidation[`${assignment.id}-parkingCost`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </section>

                    <section className="bg-white rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Cost of Living
                      </h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weekly Rent/Housing
                          </label>
                          <input
                            type="number"
                            name="rentEstimate"
                            value={assignment.rentEstimate}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                          {fieldValidation[`${assignment.id}-rentEstimate`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                          {fieldValidation[`${assignment.id}-utilitiesEstimate`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
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
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                          {fieldValidation[`${assignment.id}-groceriesEstimate`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Calculation Explanation Section */}
                  <section className="bg-blue-50 rounded-xl shadow-sm p-6 border-2 border-blue-100 mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      How We Calculate Your Contract Value
                    </h3>
                    <div className="space-y-4 text-gray-600">
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">1. Taxable Income</h4>
                        <p>Base hourly rate × Hours per week = Weekly taxable income</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">2. Non-Taxable Income (Stipends)</h4>
                        <p>Housing stipend + Meals & per diem + Other stipends = Weekly non-taxable income</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">3. Weekly Expenses</h4>
                        <p>Housing + Travel + Meals + Other expenses = Total weekly expenses</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">4. Estimated Tax Impact</h4>
                        <p>We estimate approximately 30% of your taxable income will go to taxes (actual rate may vary based on your tax situation)</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">5. Weekly Net Income</h4>
                        <p>(Taxable income - Estimated taxes + Non-taxable income) - Total expenses = Weekly net income</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">6. Total Contract Value</h4>
                        <p>(Weekly net income × Contract duration) + Sign-on bonus + Completion bonus = Total contract value</p>
                      </div>
                    </div>
                  </section>

                  {/* Financial Summary Section - Moved to bottom */}
                  <section className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Calculator className="w-6 h-6" />
                      Contract Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Weekly Summary */}
                      <div className="bg-white/10 rounded-lg p-6">
                        <h4 className="text-lg font-medium mb-4">Weekly Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Gross Income:</span>
                            <span className="font-semibold">${(calculateTaxableIncome(assignment) + calculateNonTaxableIncome(assignment)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Expenses:</span>
                            <span className="font-semibold">-${calculateExpenses(assignment).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Estimated Tax (30%):</span>
                            <span className="font-semibold">-${(calculateTaxableIncome(assignment) * 0.3).toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-white/20 my-2"></div>
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>Estimated Take Home:</span>
                            <span>${calculateNetIncome(assignment)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Total Contract Value */}
                      <div className="bg-white/10 rounded-lg p-6">
                        <h4 className="text-lg font-medium mb-4">Total Contract Value</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Duration:</span>
                            <span className="font-semibold">{assignment.contractLength || '13'} weeks</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Net Income:</span>
                            <span className="font-semibold">${(parseFloat(calculateNetIncome(assignment)) * (parseFloat(assignment.contractLength) || 13)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Bonuses:</span>
                            <span className="font-semibold">${calculateTotalBonuses(assignment).toFixed(2)}</span>
                          </div>
                          <div className="h-px bg-white/20 my-2"></div>
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total Value:</span>
                            <span>${calculateTotalContractValue(assignment)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contract Rating */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-medium mb-4 text-gray-900">Contract Rating</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div>
                            <div className="flex items-center mb-1">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const hasRequiredFields = assignment.hourlyRate && assignment.weeklyHours && assignment.contractLength;
                                  return (
                                    <Star
                                      key={star}
                                      className={`w-5 h-5 transition-colors duration-200 ${
                                        hasRequiredFields
                                          ? getRatingScore(assignment) >= star
                                            ? 'text-yellow-500 fill-yellow-500'
                                            : 'text-gray-300'
                                          : 'text-gray-200'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                              {assignment.hourlyRate && assignment.weeklyHours && assignment.contractLength ? (
                                <div className="ml-3 flex items-baseline">
                                  <span className="text-xl font-semibold text-gray-900">{getRatingScore(assignment)}</span>
                                  <span className="text-sm text-gray-500 ml-1">/5</span>
                                </div>
                              ) : null}
                            </div>
                            
                            {!assignment.hourlyRate || !assignment.weeklyHours || !assignment.contractLength ? (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                Complete {[
                                  !assignment.hourlyRate && 'pay rate',
                                  !assignment.weeklyHours && 'hours',
                                  !assignment.contractLength && 'duration'
                                ].filter(Boolean).join(' + ')} for rating
                              </p>
                            ) : (
                              <p className="text-sm mt-1 flex items-center gap-1.5">
                                {getRatingScore(assignment) >= 4 ? (
                                  <>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                    <span className="text-yellow-700 font-medium">Excellent offer</span>
                                  </>
                                ) : getRatingScore(assignment) >= 3 ? (
                                  <>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                    <span className="text-yellow-600">Good offer</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                    <span className="text-gray-600">Consider negotiating</span>
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-4 space-y-2">
                            {getRatingDetails(assignment).map((detail, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                {detail.positive ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                                )}
                                {detail.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )
            ))}
          </div>
        ) : (
          // Comparison View
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Contract Comparison</h3>
            
            {/* Weekly Net Income Comparison */}
            <div className="mb-8">
              <h4 className="text-md font-medium mb-4">Weekly Net Income Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="weeklyNet" fill="#3B82F6" name="Weekly Net Income" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Total Contract Value Comparison */}
            <div className="mb-8">
              <h4 className="text-md font-medium mb-4">Total Contract Value Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalValue" fill="#10B981" name="Total Contract Value" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Comparison Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Income</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Stipends</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Expenses</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Net</th>
                    <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${contract.weeklyIncome.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${contract.weeklyStipends.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${contract.weeklyExpenses.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${contract.weeklyNet.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">${contract.totalValue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;