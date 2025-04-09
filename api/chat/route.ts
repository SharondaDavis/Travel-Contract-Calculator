import { EdgeRuntime } from 'edge-runtime';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Check for OpenAI API key
    if (!body.apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const openai = new OpenAI({
      apiKey: body.apiKey
    });

    // Construct system message
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant for travel nurses. You have access to the following contract information:
      ${JSON.stringify(body.context?.contractData || {}, null, 2)}
      
      Please use this information to answer questions about the contract. If the contract data is not available or incomplete, let the user know.`
    };

    // Add context message if available
    const contextMessage = body.context?.contextMessage ? {
      role: 'system',
      content: body.context.contextMessage
    } : null;

    // Prepare messages for OpenAI
    const messages = [
      systemMessage,
      ...(contextMessage ? [contextMessage] : []),
      ...body.messages
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    // Return response
    return new Response(JSON.stringify({
      content: completion.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 