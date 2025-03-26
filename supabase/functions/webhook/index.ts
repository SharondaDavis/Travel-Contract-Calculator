import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface WebhookData {
  city: string;
  state: string;
  housingData: {
    averageRent: number;
    utilities: number;
    costIndex: number;
  };
  transportationData: {
    publicTransitPass: number;
    averageRideshare: number;
    fuelPrice: number;
  };
  taxData: {
    rate: number;
    brackets: Array<{
      min: number;
      max?: number;
      rate: number;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== 'ua43bfyt1ddfwg9m7zrxp18acw8fe6qe') {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const data: WebhookData = await req.json();

    // Store the received data
    const { error } = await supabase
      .from('location_data')
      .upsert({
        city: data.city,
        state: data.state,
        housing_data: data.housingData,
        transportation_data: data.transportationData,
        tax_data: data.taxData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'city,state'
      });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});