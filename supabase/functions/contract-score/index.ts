import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai@4.28.0";
import { createClient } from "npm:@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

interface ContractData {
  facilityName: string;
  location: string;
  specialty: string;
  yearsOfExperience: string;
  shiftType: string;
  contractLength: string;
  startDate: string;
  hourlyRate: string;
  weeklyHours: string;
  totalCompensation: string;
  plannedTimeOff: string[];
  seasonality: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractData }: { contractData: ContractData } = await req.json();

    const prompt = `Analyze this travel nursing contract and provide a score from 1-10, with detailed reasoning:

Contract Details:
- Facility: ${contractData.facilityName}
- Location: ${contractData.location}
- Specialty: ${contractData.specialty}
- Years of Experience: ${contractData.yearsOfExperience}
- Shift Type: ${contractData.shiftType}
- Contract Length: ${contractData.contractLength} weeks
- Start Date: ${contractData.startDate}
- Hourly Rate: $${contractData.hourlyRate}
- Weekly Hours: ${contractData.weeklyHours}
- Total Compensation: $${contractData.totalCompensation}
- Planned Time Off: ${contractData.plannedTimeOff.join(", ")}
- Season: ${contractData.seasonality}

Consider:
1. Compensation relative to location cost of living
2. Seasonality impact (weather, tourism, local events)
3. Travel considerations for time off
4. Market demand for specialty
5. Shift type desirability
6. Experience level and appropriate compensation
7. Career growth opportunities for the nurse's experience level

Provide a JSON response with:
- score (1-10)
- reasoning (detailed explanation)
- pros (array of advantages)
- cons (array of disadvantages)
- recommendations (array of suggestions)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert travel nurse contract analyst. Evaluate contracts based on comprehensive factors including compensation, location, timing, practical considerations, and the nurse's experience level. Provide tailored recommendations based on years of experience in the specialty."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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