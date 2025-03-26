import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

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

    // Make a request to your Make webhook with the location data
    const makeResponse = await fetch("https://hook.us2.make.com/ua43bfyt1ddfwg9m7zrxp18acw8fe6qe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        city,
        state,
        source: "zillow-request",
      }),
    });

    if (!makeResponse.ok) {
      throw new Error("Failed to fetch data from Make webhook");
    }

    return new Response(
      JSON.stringify({ message: "Data fetch initiated" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});