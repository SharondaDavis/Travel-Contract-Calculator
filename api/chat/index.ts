import OpenAI from 'openai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Remove Edge runtime config
// export const config = {
//   runtime: 'edge',
//   regions: ['iad1']
// };

export default async function handler(request: VercelRequest, response: VercelResponse) {
  console.log('API Route Handler Started');

  // Enable CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ 
      error: 'Method not allowed',
      details: `Method ${request.method} is not supported`
    });
    return;
  }

  try {
    console.log('Parsing request body...');
    const { messages, context, apiKey } = request.body;
    
    if (!apiKey) {
      console.log('No API key provided');
      response.status(401).json({ 
        error: 'OpenAI API key is required',
        details: 'API key was not provided in the request'
      });
      return;
    }

    console.log('Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.openai.com/v1',
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });

    // Construct system message
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant specialized in travel nurse contracts. You have access to ${context.totalContracts} contracts with detailed information about facilities, rates, benefits, and other important factors. Use this information to help the user make informed decisions about their travel nursing opportunities.

CRITICAL INSTRUCTIONS:
1. The contract data below represents the ONLY contracts that currently exist.
2. If a contract name has changed (e.g., "Rockdale" was renamed to "Piedmont"), the old name NO LONGER EXISTS.
3. When users mention old contract names (like "Rockdale"), you MUST inform them that this contract no longer exists and clarify that it was renamed to its current name (e.g., "Piedmont").
4. NEVER state that a contract exists if it's not in the current list below.
5. If a user asks about a contract that's not in the current list, respond by saying that contract no longer exists and list only the current active contracts.

Always format your responses using Markdown for better readability. Use:
- Headers (#, ##, ###) for section titles
- Bullet points (-) for lists
- Bold text (**) for important information
- Italics (*) for emphasis
- Code blocks (\`\`\`) for numerical data or calculations
- Tables for comparing multiple contracts

Keep responses concise but informative.`
    };

    // Add context message
    const contextMessage = {
      role: 'system',
      content: `Here is the contract data: ${JSON.stringify(context.contracts)}`
    };

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, contextMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    console.log('Received response from OpenAI');
    const responseContent = completion.choices[0].message.content;
    
    response.status(200).json({ content: responseContent });
  } catch (error) {
    console.error('Error in chat handler:', error);
    
    // Ensure we return a properly formatted error response
    response.status(500).json({ 
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
} 