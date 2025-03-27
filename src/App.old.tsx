import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Calculator, CheckCircle, AlertCircle, Star, Lightbulb, Trash2, Plus } from 'lucide-react';
import { useContractScore } from './hooks/useContractScore';
import { useLocationCosts } from './hooks/useLocationCosts';
import { useFuelPrices } from './hooks/useFuelPrices';
import { useRentalPrices } from './hooks/useRentalPrices';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tab } from '@headlessui/react';

interface Assignment {
  id: string;
  facilityName: string;
  location: string;
  specialty: string;
  yearsOfExperience: string;
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
  yearsOfExperience: '',
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