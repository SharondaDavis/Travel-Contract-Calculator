import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { checkForUpdates, initializeVersion } from './services/versionService';
import { UpdateNotification } from './components/UpdateNotification';
import { Calculator, CheckCircle, AlertCircle, Star, Lightbulb, Trash2, Plus, MessageSquare, Settings } from 'lucide-react';
import { useContractScore } from './hooks/useContractScore';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tab } from '@headlessui/react';
import { ContractStorageButton } from './components/ContractStorageButton';
import { ChatPanel } from './components/ChatPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { toast, Toaster } from 'react-hot-toast';

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
  vehicleMpg: string;
  parkingCost: string;
  useCurrentGasPrice: boolean;
  data?: {
    housing_data?: any;
    transportation_data?: any;
    tax_data?: any;
    [key: string]: any;
  };
  plannedTimeOff: string[];
  seasonality: string;
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
  transportationType: '',
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
  vehicleMpg: '25',
  parkingCost: '',
  useCurrentGasPrice: true,
  data: {},
  plannedTimeOff: [],
  seasonality: 'summer'
};

function App() {
  const [assignments, setAssignments] = useState<Assignment[]>([initialAssignment]);
  const [activeAssignments, setActiveAssignments] = useState<Set<string>>(new Set([initialAssignment.id]));
  const [activeComparisonContracts, setActiveComparisonContracts] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'details' | 'comparison'>('details');
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>(initialAssignment.id);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const initVersion = async () => {
      console.log('Initializing version check...');
      await initializeVersion();
      const hasUpdate = await checkForUpdates();
      console.log('Update check result:', hasUpdate);
      setUpdateAvailable(hasUpdate);
    };

    // Initialize version on mount
    initVersion();

    // Check periodically (every 5 minutes)
    const interval = setInterval(async () => {
      const hasUpdate = await checkForUpdates();
      setUpdateAvailable(hasUpdate);
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  // Track field validation
  const [fieldValidation, setFieldValidation] = useState<{ [key: string]: boolean }>({});

  const handleInputChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string | boolean } }) => {
    const { name, value } = e.target;
    setAssignments(prev => prev.map(assignment => {
      if (assignment.id === id) {
        if (name === 'useCurrentGasPrice') {
          // Handle boolean checkbox value
          return { ...assignment, [name]: value as boolean };
        }
        return { ...assignment, [name]: value as string };
      }
      return assignment;
    }));

    // Only validate string fields
    if (typeof value === 'string') {
      if (value.trim() === '') {
        setFieldValidation(prev => ({ ...prev, [name]: false }));
      } else {
        setFieldValidation(prev => ({ ...prev, [name]: true }));
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

  const calculateTakeHomePay = (assignment: Assignment) => {
    // Calculate taxable income (hourly pay)
    const weeklyTaxableIncome = calculateTaxableIncome(assignment);
    
    // Estimate taxes (using approximate tax rate of 25% for illustration)
    const estimatedTaxRate = 0.25;
    const weeklyTaxes = weeklyTaxableIncome * estimatedTaxRate;
    
    // Calculate non-taxable income (stipends)
    const weeklyNonTaxableIncome = calculateNonTaxableIncome(assignment);
    
    // Calculate take-home pay
    const weeklyTakeHome = (weeklyTaxableIncome - weeklyTaxes) + weeklyNonTaxableIncome;
    
    return {
      weeklyTakeHome,
      weeklyTaxableIncome,
      weeklyNonTaxableIncome,
      weeklyTaxes
    };
  };

  // Current average gas price (this would normally come from an API)
  const getCurrentGasPrice = () => {
    // This is a placeholder. In production, you'd fetch this from a gas price API
    return 3.50; // National average as of 2025
  };

  const calculateTransportationExpenses = (assignment: Assignment) => {
    if (assignment.transportationType === 'public' || assignment.transportationType === 'rideshare') {
      return parseFloat(assignment.transportationCost) || 0;
    }

    // Personal vehicle calculations
    const parking = parseFloat(assignment.parkingCost) || 0;
    const distance = parseFloat(assignment.commuteDistance) || 0;
    const mpg = parseFloat(assignment.vehicleMpg) || 25; // Use custom MPG or default to 25
    
    // Get gas price
    const gasPrice = assignment.useCurrentGasPrice 
      ? getCurrentGasPrice()
      : (parseFloat(assignment.fuelCostPerGallon) || getCurrentGasPrice());
    
    // Calculate monthly fuel expenses
    // Formula: (one-way distance * 2 for round trip * 5 workdays * 4 weeks * gas price) / MPG
    const monthlyFuelCost = ((distance * 2 * 5 * 4 * gasPrice) / mpg);
    
    // Total monthly transportation cost
    return monthlyFuelCost + parking;
  };

  const calculateLivingExpenses = (assignment: Assignment) => {
    const housing = parseFloat(assignment.housingCost) || 0;
    const food = parseFloat(assignment.foodCost) || 0;
    const other = parseFloat(assignment.otherCost) || 0;
    return housing + food + other;
  };

  const calculateExpenses = (assignment: Assignment) => {
    // We only want to count actual expenses, not stipends
    const transportation = calculateTransportationExpenses(assignment);
    const living = calculateLivingExpenses(assignment);
    return transportation + living;
  };

  const calculateTotalBonuses = (assignment: Assignment) => {
    const signOn = parseFloat(assignment.signOnBonus) || 0;
    const completion = parseFloat(assignment.completionBonus) || 0;
    const referral = parseFloat(assignment.referralBonus) || 0;
    const otherBonus = parseFloat(assignment.otherBonus) || 0;
    return signOn + completion + referral + otherBonus;
  };

  const calculateNetIncome = (assignment: Assignment) => {
    const { weeklyTakeHome } = calculateTakeHomePay(assignment);
    const expenses = calculateExpenses(assignment);

    // Calculate weekly net (take-home pay minus expenses)
    return (weeklyTakeHome - expenses).toFixed(2);
  };

  const calculateTotalContractValue = (assignment: Assignment) => {
    const { weeklyTakeHome } = calculateTakeHomePay(assignment);
    const weeks = parseFloat(assignment.contractLength) || 13;
    const bonuses = calculateTotalBonuses(assignment);
    
    // Calculate total from weekly take-home (before expenses)
    const totalFromWeekly = weeklyTakeHome * weeks;
    
    // Calculate total expenses for the contract duration
    const weeklyExpenses = calculateExpenses(assignment);
    const totalExpenses = weeklyExpenses * weeks;
    
    // Calculate final total: (weekly take-home - expenses) * weeks + bonuses
    return (totalFromWeekly - totalExpenses + bonuses).toFixed(2);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      {updateAvailable && (
        <UpdateNotification
          onRefresh={handleRefresh}
          onDismiss={handleDismiss}
        />
      )}
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Facility Name
                          </label>
                          <input
                            type="text"
                            name="facilityName"
                            value={assignment.facilityName}
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                  onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                  onChange={(e) => handleInputChange(assignment.id, e)}
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
                                  onChange={(e) => handleInputChange(assignment.id, e)}
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
                            value={assignment.transportationType}
                            onChange={(e) => handleInputChange(assignment.id, e)}
                            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Select Type</option>
                            <option value="public">Public Transportation</option>
                            <option value="rideshare">Rideshare</option>
                            <option value="personal">Personal Vehicle</option>
                          </select>
                        </div>

                        {assignment.transportationType === 'personal' && (
                          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            <h5 className="font-medium text-gray-700">Personal Vehicle Details</h5>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                  Daily Commute (miles)
                                </label>
                                <input
                                  type="text"
                                  name="commuteDistance"
                                  value={assignment.commuteDistance}
                                  onChange={(e) => handleInputChange(assignment.id, e)}
                                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                                  placeholder="One-way distance"
                                />
                              </div>

                              <div>
                                <label className="block text-sm text-gray-600 mb-1">
                                  Vehicle MPG
                                </label>
                                <input
                                  type="text"
                                  name="vehicleMpg"
                                  value={assignment.vehicleMpg}
                                  onChange={(e) => handleInputChange(assignment.id, e)}
                                  className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                                  placeholder="Miles per gallon"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-sm text-gray-600">
                                  Gas Price (per gallon)
                                </label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    name="useCurrentGasPrice"
                                    checked={assignment.useCurrentGasPrice}
                                    onChange={(e) => handleInputChange(assignment.id, { target: { name: 'useCurrentGasPrice', value: e.target.checked } })}
                                    className="form-checkbox h-4 w-4 text-blue-600"
                                  />
                                  <span className="text-sm text-gray-500">Use current average</span>
                                </div>
                              </div>
                              
                              <input
                                type="text"
                                name="fuelCostPerGallon"
                                value={assignment.fuelCostPerGallon}
                                onChange={(e) => handleInputChange(assignment.id, e)}
                                disabled={assignment.useCurrentGasPrice}
                                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                                placeholder={assignment.useCurrentGasPrice ? 'Using current average' : 'Enter price per gallon'}
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Monthly Parking Cost
                              </label>
                              <input
                                type="text"
                                name="parkingCost"
                                value={assignment.parkingCost}
                                onChange={(e) => handleInputChange(assignment.id, e)}
                                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                                placeholder="Enter parking cost"
                              />
                            </div>
                          </div>
                        )}

                        {(assignment.transportationType === 'public' || assignment.transportationType === 'rideshare') && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm text-gray-600 mb-1">
                                Monthly Transportation Cost
                              </label>
                              <input
                                type="text"
                                name="transportationCost"
                                value={assignment.transportationCost}
                                onChange={(e) => handleInputChange(assignment.id, e)}
                                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                                placeholder="Enter monthly cost"
                              />
                            </div>
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
                              onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                                onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                            onChange={(e) => handleInputChange(assignment.id, e)}
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
                          {/* Income Section */}
                          <div>
                            <div className="text-sm text-white/80 mb-2">Weekly Income</div>
                            <div className="flex justify-between items-center">
                              <span>Base Pay (Taxable):</span>
                              <span className="font-semibold">${calculateTaxableIncome(assignment).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Housing Stipend:</span>
                              <span className="font-semibold text-green-300">+${parseFloat(assignment.housingStipend || '0').toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Meal Stipend:</span>
                              <span className="font-semibold text-green-300">+${parseFloat(assignment.mealStipend || '0').toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Other Stipends:</span>
                              <span className="font-semibold text-green-300">+${(parseFloat(assignment.transportationStipend || '0') + parseFloat(assignment.otherStipend || '0')).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Deductions Section */}
                          <div className="h-px bg-white/20 my-2"></div>
                          <div>
                            <div className="text-sm text-white/80 mb-2">Weekly Deductions</div>
                            <div className="flex justify-between items-center">
                              <span>Total Expenses:</span>
                              <span className="font-semibold text-red-300">-${calculateExpenses(assignment).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Estimated Tax (30%):</span>
                              <span className="font-semibold text-red-300">-${(calculateTaxableIncome(assignment) * 0.3).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Weekly Take-Home Pay Breakdown */}
                          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm text-gray-900">
                            <h4 className="text-lg font-medium mb-4">Weekly Take-Home Pay Breakdown</h4>
                            {(() => {
                              const {
                                weeklyTakeHome,
                                weeklyTaxableIncome,
                                weeklyNonTaxableIncome,
                                weeklyTaxes
                              } = calculateTakeHomePay(assignment);
                              return (
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-900">Hourly Pay (Taxable):</span>
                                    <span className="text-gray-900">${weeklyTaxableIncome.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-900">Estimated Taxes:</span>
                                    <span className="text-red-600">-${weeklyTaxes.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-900">Weekly Stipends (Non-Taxable):</span>
                                    <span className="text-green-600">+${weeklyNonTaxableIncome.toFixed(2)}</span>
                                  </div>
                                  <div className="h-px bg-gray-200 my-2"></div>
                                  <div className="flex justify-between items-center font-medium">
                                    <span className="text-gray-900">Total Weekly Take-Home:</span>
                                    <span className="text-xl text-gray-900">${weeklyTakeHome.toFixed(2)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Weekly Net Income (After Expenses) */}
                          <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Weekly Net Income (After Expenses)</h4>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-900">Weekly Net Income:</span>
                              <div className="text-xl text-gray-900">
                                <span>${calculateNetIncome(assignment)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Final Take Home */}
                          <div className="h-px bg-gray-200 my-2"></div>
                          <div className="flex justify-between items-center text-lg font-bold text-gray-900">
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
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Contract Comparison</h3>
            
            {/* Contract Filter Buttons */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {assignments.map((assignment) => (
                <button
                  key={assignment.id}
                  onClick={() => toggleContractInComparison(assignment.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    activeComparisonContracts.has(assignment.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {assignment.facilityName || `Contract ${assignment.id}`}
                </button>
              ))}
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