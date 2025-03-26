import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface FacilityPrediction {
  facility_name: string;
  confidence_score: number;
  contract_count: number;
  avg_hourly_rate: number;
  common_shift_type: string;
}

export async function getLikelyFacilities(
  city: string,
  state: string,
  specialty: string,
  agencyName: string
): Promise<FacilityPrediction[]> {
  const { data, error } = await supabase
    .rpc('get_likely_facilities', {
      p_city: city,
      p_state: state,
      p_specialty: specialty,
      p_agency_name: agencyName
    });

  if (error) throw error;
  return data;
}

export async function submitContractData(contractData: {
  agencyName: string;
  specialty: string;
  city: string;
  state: string;
  facilityName: string;
  shiftType: string;
  contractLength: number;
  hourlyRate: number;
}) {
  // First, ensure the facility exists
  const { data: facilityData, error: facilityError } = await supabase
    .from('facilities')
    .upsert({
      name: contractData.facilityName,
      city: contractData.city,
      state: contractData.state,
      facility_type: 'hospital', // Default type
    })
    .select()
    .single();

  if (facilityError) throw facilityError;

  // Then add the contract history
  const { error: contractError } = await supabase
    .from('contract_history')
    .insert({
      agency_name: contractData.agencyName,
      specialty: contractData.specialty,
      city: contractData.city,
      state: contractData.state,
      facility_id: facilityData.id,
      shift_type: contractData.shiftType,
      contract_length: contractData.contractLength,
      hourly_rate: contractData.hourlyRate,
    });

  if (contractError) throw contractError;
}