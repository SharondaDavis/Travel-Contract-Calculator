import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Tab } from '@headlessui/react';
import { Toaster, toast } from 'react-hot-toast';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, MapPin, X, MessageSquare, Settings, Calculator, Star, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { ContractStorageButton } from './components/ContractStorageButton';
import { ChatPanel } from './components/ChatPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { AddressInput } from './components/distance-calculator/AddressInput';
import { QualificationSpectrum } from './components/distance-calculator/QualificationSpectrum';
import { calculateDistance, getSimulatedDistance } from './services/geolocation';
import { useContractScore } from './hooks/useContractScore';
import { FacilityInput } from './components/FacilityInput';

interface Assignment {
  id: string;
  facilityName: string;
  location: string;
  specialty: string;
  shiftType: string;
  contractLength: string;
  startDate: string;
  endDate: string;
  hourlyRate: string;
  weeklyHours: string;
  housingStipend: string;
  mealStipend: string;
  transportationStipend: string;
  otherStipend: string;
  transportationType: string;
  transportationCost: string;
  housingCost: string;
  foodCost: string;
  otherCost: string;
  signOnBonus: string;
  completionBonus: string;
  referralBonus: string;
  otherBonus: string;
  rideshareExpenses: string;
  commuteDistance: string;
  fuelCostPerGallon: string;
  parkingCost: string;
  data?: {
    housing_data?: any;
    transportation_data?: any;
    tax_data?: any;
    [key: string]: any;
  };
  plannedTimeOff: string[];
  seasonality: string;
  distanceToAssignment?: number;
  distanceQualifies?: boolean;
  agency: string;
}

export type { Assignment };

const initialAssignment: Assignment = {
  id: '1',
  facilityName: '',
  location: '',
  specialty: '',
  shiftType: '',
  contractLength: '',
  startDate: '',
  endDate: '',
  hourlyRate: '',
  weeklyHours: '36',
  housingStipend: '',
  mealStipend: '',
  transportationStipend: '',
  otherStipend: '',
  transportationType: 'personal',
  transportationCost: '',
  housingCost: '',
  foodCost: '',
  otherCost: '',
  signOnBonus: '',
  completionBonus: '',
  referralBonus: '',
  otherBonus: '',
  rideshareExpenses: '',
  commuteDistance: '',
  fuelCostPerGallon: '',
  parkingCost: '',
  data: {},
  plannedTimeOff: [],
  seasonality: 'summer',
  distanceToAssignment: undefined,
  distanceQualifies: false,
  agency: 'Other'
};

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      facilityName: '',
      location: '',
      specialty: '',
      shiftType: 'day',
      contractLength: '',
      startDate: '',
      endDate: '',
      hourlyRate: '',
      weeklyHours: '36',
      housingStipend: '',
      mealStipend: '',
      transportationStipend: '',
      otherStipend: '',
      transportationType: 'personal',
      transportationCost: '',
      housingCost: '',
      foodCost: '',
      otherCost: '',
      signOnBonus: '',
      completionBonus: '',
      referralBonus: '',
      otherBonus: '',
      rideshareExpenses: '',
      commuteDistance: '',
      fuelCostPerGallon: '',
      parkingCost: '',
      data: {},
      plannedTimeOff: [],
      seasonality: 'summer',
      distanceToAssignment: undefined,
      distanceQualifies: false,
      agency: 'Other'
    }
  ]);
  const [activeAssignments, setActiveAssignments] = useState<Set<string>>(new Set([initialAssignment.id]));
  const [activeComparisonContracts, setActiveComparisonContracts] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'details' | 'comparison'>('details');
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>(initialAssignment.id);
  const [userHomeAddress, setUserHomeAddress] = useState<string>('');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [tempHomeAddress, setTempHomeAddress] = useState<string>('');

  // Track field validation
  const [fieldValidation, setFieldValidation] = useState<{ [key: string]: boolean }>({});

  // Load home address from localStorage on initial render
  useEffect(() => {
    const savedHomeAddress = localStorage.getItem('userHomeAddress');
    if (savedHomeAddress) {
      setUserHomeAddress(savedHomeAddress);
    }
  }, []);

  // Save home address to localStorage whenever it changes
  useEffect(() => {
    if (userHomeAddress) {
      localStorage.setItem('userHomeAddress', userHomeAddress);
    }
  }, [userHomeAddress]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }, id: string) => {
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

  const calculateAndUpdateDistance = async (id: string, assignmentAddress: string) => {
    if (!userHomeAddress || !assignmentAddress) {
      toast.error('Both home and assignment addresses are required for distance calculation');
      return;
    }

    try {
      // Try to calculate the actual distance
      const calculatedDistance = await calculateDistance(userHomeAddress, assignmentAddress);
      
      // Update the assignment with the calculated distance
      setAssignments(prev => prev.map(assignment => {
        if (assignment.id === id) {
          const qualifies = calculatedDistance >= 45; // Default qualification threshold
          return {
            ...assignment,
            distanceToAssignment: calculatedDistance,
            distanceQualifies: qualifies
          };
        }
        return assignment;
      }));
      
      toast.success(`Distance calculated: ${calculatedDistance.toFixed(1)} miles`);
    } catch (error) {
      console.error('Error calculating distance:', error);
      
      try {
        // Fallback to simulated distance for demo purposes
        const simulatedDistance = await getSimulatedDistance(userHomeAddress, assignmentAddress);
        
        // Update the assignment with the simulated distance
        setAssignments(prev => prev.map(assignment => {
          if (assignment.id === id) {
            const qualifies = simulatedDistance >= 45; // Default qualification threshold
            return {
              ...assignment,
              distanceToAssignment: simulatedDistance,
              distanceQualifies: qualifies
            };
          }
          return assignment;
        }));
        
        toast.success(`Simulated distance calculated: ${simulatedDistance.toFixed(1)} miles (for demonstration)`);
      } catch (simError) {
        toast.error('Unable to calculate distance. Please check addresses and try again.');
      }
    }
  };

  const addNewAssignment = () => {
    const newId = (assignments.length + 1).toString();
    const newAssignment = { ...initialAssignment, id: newId };
    setAssignments(prev => [...prev, newAssignment]);
    setSelectedContractId(newId);
  };

  const calculateTaxableIncome = (assignment: Assignment) => {
    const hourlyRate = parseFloat(assignment.hourlyRate) || 0;
    const weeklyHours = parseFloat(assignment.weeklyHours) || 0;
    return hourlyRate * weeklyHours;
  };

  const calculateNonTaxableIncome = (assignment: Assignment) => {
    const housing = parseFloat(assignment.housingStipend) || 0;
    const meals = parseFloat(assignment.mealStipend) || 0;
    const transportation = parseFloat(assignment.transportationStipend) || 0;
    const other = parseFloat(assignment.otherStipend) || 0;
    return housing + meals + transportation + other;
  };

  const calculateTransportationExpenses = (assignment: Assignment) => {
    const publicTransport = parseFloat(assignment.transportationCost) || 0;
    const rideshare = parseFloat(assignment.transportationStipend) || 0;
    const parking = parseFloat(assignment.housingCost) || 0;
    const distance = parseFloat(assignment.housingCost) || 0;
    const fuelCostPerGallon = parseFloat(assignment.foodCost) || 0;
    const mpg = parseFloat(assignment.transportationStipend) || 25;
    
    // Calculate fuel expenses based on distance, MPG, and cost per gallon (assuming 5 work days)
    // Formula: (distance * 2 * 5 * fuelCostPerGallon) / MPG
    const weeklyFuelExpense = ((distance * 2 * 5) / mpg) * fuelCostPerGallon;
    
    return publicTransport + rideshare + parking + weeklyFuelExpense;
  };

  const calculateLivingExpenses = (assignment: Assignment) => {
    const rent = parseFloat(assignment.housingCost) || 0;
    const utilities = parseFloat(assignment.foodCost) || 0;
    const groceries = parseFloat(assignment.otherCost) || 0;
    return rent + utilities + groceries;
  };

  const calculateExpenses = (assignment: Assignment) => {
    const housing = parseFloat(assignment.housingCost) || 0;
    const health = parseFloat(assignment.housingStipend) || 0;
    const travel = parseFloat(assignment.transportationCost) || 0;
    const transportation = calculateTransportationExpenses(assignment);
    const living = calculateLivingExpenses(assignment);
    return housing + health + travel + transportation + living;
  };

  const calculateTotalBonuses = (assignment: Assignment) => {
    const signOn = parseFloat(assignment.signOnBonus) || 0;
    const completion = parseFloat(assignment.completionBonus) || 0;
    const referral = parseFloat(assignment.referralBonus) || 0;
    const otherBonus = parseFloat(assignment.otherBonus) || 0;
    return signOn + completion + referral + otherBonus;
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
        { name: 'Housing', value: parseFloat(assignment.housingCost) || 0 },
        { name: 'Transportation', value: calculateTransportationExpenses(assignment) },
        { name: 'Healthcare', value: parseFloat(assignment.housingStipend) || 0 },
        { name: 'Food & Utilities', value: (parseFloat(assignment.foodCost) || 0) + (parseFloat(assignment.otherCost) || 0) },
        { name: 'Travel', value: parseFloat(assignment.transportationCost) || 0 }
      ]
    };
  }, []);

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    return assignments
      .filter(assignment => activeComparisonContracts.has(assignment.id))
      .map(assignment => ({
      id: assignment.id,
      name: assignment.facilityName || `Contract ${assignment.id}`,
      ...getAssignmentMetrics(assignment)
    }));
  }, [assignments, getAssignmentMetrics, activeComparisonContracts]);

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

  const getContractTips = (assignment: Assignment) => {
    const tips: string[] = [];
    if (parseFloat(calculateTotalContractValue(assignment)) > 50000) {
      tips.push('Consider negotiating for a higher salary');
    }
    if (parseFloat(calculateNetIncome(assignment)) > 1000) {
      tips.push('You may be able to afford a more expensive lifestyle');
    }
    if (calculateExpenses(assignment) < 500) {
      tips.push('You may be able to save more money');
    }
    return tips;
  };

  const handleDeleteAssignment = (id: string) => {
    if (assignments.length > 1) {
      setAssignments(prev => prev.filter(a => a.id !== id));
      if (activeAssignments.has(id)) {
        setActiveAssignments(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    }
  };

  const toggleContractInComparison = (contractId: string) => {
    setActiveComparisonContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contractId)) {
        newSet.delete(contractId);
      } else {
        newSet.add(contractId);
      }
      return newSet;
    });
  };

  const toggleActiveAssignment = useCallback((id: string) => {
    setSelectedContractId(id);
  }, []);

  const saveHomeAddress = () => {
    setUserHomeAddress(tempHomeAddress);
    setShowUserProfile(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-12">
          <div className="flex flex-col items-center gap-3 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">Travel Nurse Contract Calculator</h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">AI-assisted travel nurse contract comparison</p>
          <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowChat(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200"
                title="Chat about your contracts"
              >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                title="Settings"
              >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
              </button>
            </div>
        </header>

        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Profile</h2>
            <button 
              onClick={() => {
                setTempHomeAddress(userHomeAddress);
                setShowUserProfile(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit Profile
            </button>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home Address <span className="text-xs text-gray-500">(required for distance calculations)</span>
            </label>
            <AddressInput
              label=""
              value={userHomeAddress}
              onChange={(value) => setUserHomeAddress(value)}
              placeholder="Enter your complete home address with city and state"
              includeFacilities={false}
              returnMetadata={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              Your home address is used to calculate distance to assignments for tax-free stipend qualification.
            </p>
          </div>
        </div>

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
                View Comparison
              </Tab>
            </Tab.List>
          </Tab.Group>
        </div>

        {/* Contract Navigation */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {view === 'details' && assignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => toggleActiveAssignment(assignment.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                selectedContractId === assignment.id
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
          {view === 'details' && (
            <button
              onClick={addNewAssignment}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 shadow-sm transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Contract
            </button>
          )}
        </div>

        {view === 'details' ? (
          <div className="space-y-6">
            {assignments.map((assignment) => {
              if (selectedContractId === assignment.id) {
                return (
                <div key={assignment.id} className="space-y-6">
                    {/* Contract details form */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <section className="bg-white rounded-xl shadow-lg p-6">
                      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        Facility Details
                      </h2>
                      
                      <div className="space-y-4">
                        {/* Combined Facility Name & Location Input with Distance Display */}
                        <FacilityInput
                          facilityName={assignment.facilityName}
                          location={assignment.location}
                          onFacilityChange={(facilityName, location) => {
                            // Update facility name
                            const facilityNameEvent = { target: { name: 'facilityName', value: facilityName } };
                            handleInputChange(facilityNameEvent, assignment.id);
                            
                            // Update location
                            const locationEvent = { target: { name: 'location', value: location } };
                            handleInputChange(locationEvent, assignment.id);
                          }}
                          id={assignment.id}
                          fieldValidation={fieldValidation}
                          homeAddress={userHomeAddress}
                          agencyName={assignment.agency}
                          onDistanceCalculated={(distance, qualifies) => {
                            // Update the assignment with the calculated distance
                            setAssignments(prev => prev.map(a => {
                              if (a.id === assignment.id) {
                                return {
                                  ...a,
                                  distanceToAssignment: distance,
                                  distanceQualifies: qualifies
                                };
                              }
                              return a;
                            }));
                          }}
                        />

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
                                  name="mealStipend"
                                  value={assignment.mealStipend}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                                {fieldValidation[`${assignment.id}-mealStipend`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Transportation Stipend</label>
                              <input
                                type="number"
                                  name="transportationStipend"
                                  value={assignment.transportationStipend}
                                onChange={(e) => handleInputChange(e, assignment.id)}
                                className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                placeholder="0.00"
                              />
                                {fieldValidation[`${assignment.id}-transportationStipend`] && (
                                <div className="text-green-500 mt-1">
                                  <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="ml-2">Valid</span>
                                </div>
                              )}
                            </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Other Stipend</label>
                                <input
                                  type="number"
                                  name="otherStipend"
                                  value={assignment.otherStipend}
                                  onChange={(e) => handleInputChange(e, assignment.id)}
                                  className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                  placeholder="0.00"
                                />
                                {fieldValidation[`${assignment.id}-otherStipend`] && (
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
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Referral Bonus</label>
                                <input
                                  type="number"
                                  name="referralBonus"
                                  value={assignment.referralBonus}
                                  onChange={(e) => handleInputChange(e, assignment.id)}
                                  className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                  placeholder="0.00"
                                />
                                {fieldValidation[`${assignment.id}-referralBonus`] && (
                                  <div className="text-green-500 mt-1">
                                    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="ml-2">Valid</span>
                          </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Other Bonus</label>
                                <input
                                  type="number"
                                  name="otherBonus"
                                  value={assignment.otherBonus}
                                  onChange={(e) => handleInputChange(e, assignment.id)}
                                  className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                                  placeholder="0.00"
                                />
                                {fieldValidation[`${assignment.id}-otherBonus`] && (
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
                            value={assignment.shiftType}
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

                        {/* Display distance qualification status if available */}
                        {assignment.distanceToAssignment !== undefined && (
                          <div className="p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Distance qualification:</p>
                                <div className="flex items-center mt-1">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    assignment.distanceQualifies 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {assignment.distanceQualifies ? 'Qualifies' : 'Does not qualify'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">Distance:</p>
                                <p className="text-lg font-bold">{assignment.distanceToAssignment.toFixed(1)} miles</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {assignment.shiftType === 'public' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Weekly Public Transport Cost
                            </label>
                            <input
                              type="number"
                                name="transportationCost"
                                value={assignment.transportationCost}
                              onChange={(e) => handleInputChange(e, assignment.id)}
                              className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                              placeholder="0.00"
                            />
                              {fieldValidation[`${assignment.id}-transportationCost`] && (
                              <div className="text-green-500 mt-1">
                                <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="ml-2">Valid</span>
                              </div>
                            )}
                          </div>
                        )}

                        {assignment.shiftType === 'rideshare' && (
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

                        {assignment.shiftType === 'personal' && (
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
                              name="housingCost"
                              value={assignment.housingCost}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                            {fieldValidation[`${assignment.id}-housingCost`] && (
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
                              name="foodCost"
                              value={assignment.foodCost}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                            {fieldValidation[`${assignment.id}-foodCost`] && (
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
                              name="otherCost"
                              value={assignment.otherCost}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                            placeholder="0.00"
                          />
                            {fieldValidation[`${assignment.id}-otherCost`] && (
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
                        Agency
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Agency Type
                          </label>
                          <select
                            name="agency"
                            value={assignment.agency}
                            onChange={(e) => handleInputChange(e, assignment.id)}
                            className="w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-2 focus:border-green-600 focus:ring-green-500 transition-colors duration-200 bg-white hover:border-gray-500 px-4 py-2"
                          >
                            <option value="Other">Other (45 miles)</option>
                            <option value="Type A (50 miles)">Type A (50 miles)</option>
                            <option value="Type B (45 miles)">Type B (45 miles)</option>
                            <option value="Type C (40 miles)">Type C (40 miles)</option>
                            <option value="Custom">Custom Distance</option>
                          </select>
                          {fieldValidation[`${assignment.id}-agency`] && (
                            <div className="text-green-500 mt-1">
                              <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="ml-2">Valid</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Different agency types have different distance requirements for tax-free stipend qualification.
                          </p>
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
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contract Comparison View */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-6">Contract Comparison</h3>
              
              {/* Contract Selection */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3">Select Contracts to Compare</h4>
                <div className="flex flex-wrap gap-2">
                  {assignments.map((assignment) => (
                    <button
                      key={assignment.id}
                      onClick={() => toggleContractInComparison(assignment.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        activeComparisonContracts.has(assignment.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } shadow-sm transition-colors duration-200`}
                    >
                      {assignment.facilityName || `Contract ${assignment.id}`}
                    </button>
                  ))}
                </div>
              </div>
              
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
          </div>
        )}

        {showUserProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Profile</h2>
                <button onClick={() => setShowUserProfile(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-4">
                <AddressInput
                  label="Home Address"
                  value={tempHomeAddress}
                  onChange={(value) => setTempHomeAddress(value)}
                  placeholder="Enter your home address"
                  includeFacilities={true}
                  returnMetadata={true}
                />
                <p className="text-sm text-gray-500 mt-1">
                  This address will be used for all distance calculations.
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowUserProfile(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveHomeAddress}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showChat && (
          <ChatPanel
            contracts={assignments}
            onClose={() => setShowChat(false)}
          />
        )}

        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex justify-center gap-4">
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
        </footer>
      </div>
    </div>
  );
}

export default App;