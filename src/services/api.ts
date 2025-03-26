import axios from 'axios';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Schema definitions for type safety
const TaxRateSchema = z.object({
  state: z.string(),
  rate: z.number(),
  brackets: z.array(
    z.object({
      min: z.number(),
      max: z.number().optional(),
      rate: z.number(),
    })
  ),
});

const HousingDataSchema = z.object({
  city: z.string(),
  state: z.string(),
  averageRent: z.number(),
  utilities: z.number(),
  costIndex: z.number(),
});

const TransportationDataSchema = z.object({
  city: z.string(),
  state: z.string(),
  publicTransitPass: z.number(),
  averageRideshare: z.number(),
  fuelPrice: z.number(),
});

export type TaxRate = z.infer<typeof TaxRateSchema>;
export type HousingData = z.infer<typeof HousingDataSchema>;
export type TransportationData = z.infer<typeof TransportationDataSchema>;

export const fetchLocationData = async (city: string, state: string) => {
  // First, trigger the Zillow data fetch
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/zillow-data`;
  await fetch(`${functionUrl}?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`, {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });

  // Then fetch the data from our database
  const { data, error } = await supabase
    .from('location_data')
    .select('*')
    .eq('city', city)
    .eq('state', state)
    .single();

  if (error) throw error;

  return {
    housingData: HousingDataSchema.parse({
      city: data.city,
      state: data.state,
      ...data.housing_data
    }),
    transportationData: TransportationDataSchema.parse({
      city: data.city,
      state: data.state,
      ...data.transportation_data
    }),
    taxData: TaxRateSchema.parse({
      state: data.state,
      ...data.tax_data
    })
  };
};