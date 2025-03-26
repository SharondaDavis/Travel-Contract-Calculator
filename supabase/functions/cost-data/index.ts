import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import { z } from "npm:zod@3.22.4";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const HousingDataSchema = z.object({
  median_rent: z.number(),
  average_home_price: z.number(),
  utilities: z.object({
    electric: z.number(),
    gas: z.number(),
    water: z.number(),
    internet: z.number(),
  }),
});

const TransportationDataSchema = z.object({
  public_transit: z.object({
    monthly_pass: z.number(),
    single_ticket: z.number(),
  }),
  fuel: z.object({
    price_per_gallon: z.number(),
    average_commute_miles: z.number(),
  }),
  rideshare: z.object({
    average_mile_cost: z.number(),
    base_fare: z.number(),
  }),
});

async function generateLocationData(city: string, state: string) {
  const prompt = `Generate realistic cost of living data for ${city}, ${state} in 2025. Include:
1. Housing costs (median rent, home prices, utilities)
2. Transportation costs (public transit, fuel prices, rideshare)
3. Cost of living index
4. Local tax rates

Format as JSON with realistic values based on historical trends and regional factors.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a cost of living data analyst. Provide realistic, well-researched estimates based on historical trends and regional factors. Only respond with valid JSON data."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" }
  });

  const aiData = JSON.parse(completion.choices[0].message.content);
  
  // Transform AI response into our schema
  return {
    city,
    state,
    housing_data: {
      median_rent: aiData.housing.median_rent,
      average_home_price: aiData.housing.average_home_price,
      utilities: aiData.housing.utilities
    },
    transportation_data: {
      public_transit: aiData.transportation.public_transit,
      fuel: aiData.transportation.fuel,
      rideshare: aiData.transportation.rideshare
    },
    cost_of_living_index: aiData.cost_of_living_index,
    tax_rate: aiData.tax_rate,
    updated_at: new Date().toISOString(),
    data_source: "AI Generated (GPT-4)",
    last_api_update: new Date().toISOString()
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const city = url.searchParams.get("city");
    const state = url.searchParams.get("state");

    if (!city || !state) {
      throw new Error("City and state parameters are required");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check cache first
    const { data: existingData, error: dbError } = await supabase
      .from('location_data')
      .select('*')
      .eq('city', city)
      .eq('state', state)
      .maybeSingle();

    if (existingData && !shouldUpdateData(existingData.last_api_update)) {
      return new Response(
        JSON.stringify(existingData),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new data using AI
    const locationData = await generateLocationData(city, state);

    // Validate generated data
    HousingDataSchema.parse(locationData.housing_data);
    TransportationDataSchema.parse(locationData.transportation_data);

    // Store in Supabase
    const { error: upsertError } = await supabase
      .from('location_data')
      .upsert(locationData, {
        onConflict: 'city,state'
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify(locationData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in cost-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function shouldUpdateData(lastUpdate: string | null): boolean {
  if (!lastUpdate) return true;
  const lastUpdateDate = new Date(lastUpdate);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > 7; // Update if data is older than 7 days
}