import { OpenAI } from 'openai';

export const runtime = 'edge';
export const preferredRegion = 'iad1';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const systemMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for a travel contract calculator application. 
      Your role is to help users understand and use the calculator effectively.
      You should:
      1. Explain how to use the calculator
      2. Help interpret results
      3. Provide guidance on contract terms
      4. Answer questions about travel contracts
      5. Be professional and concise
      
      Do not:
      1. Make up information
      2. Provide financial advice
      3. Share personal opinions
      4. Discuss topics outside of travel contracts
      
      If you're unsure about something, say so and suggest consulting a professional.`
    };

    const contextMessage = {
      role: 'system',
      content: `Current context: The user is interacting with a travel contract calculator that helps calculate potential earnings and expenses for travel contracts.`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, contextMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return new Response(
      JSON.stringify({ response: completion.choices[0].message.content }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing chat request' }),
      { status: 500 }
    );
  }
} 