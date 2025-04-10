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
      content: `You are a helpful assistant specialized in travel nurse contracts. You are provided with the CURRENT contract data in each new conversation - this is the ONLY valid contract data you should reference.

CRITICAL RULES:
1. ONLY use the contract data provided in THIS conversation. Disregard any contract information from previous conversations.
2. DO NOT reference historical data about contracts that is not included in the current dataset.
3. The contracts array provided in THIS conversation contains the ONLY currently valid contracts.
4. When a user mentions a contract that's not in the current dataset, inform them it's not available and ONLY suggest contracts from the current dataset.
5. If contract names have changed (e.g., a facility was renamed), only acknowledge the CURRENT names in the dataset.
6. IGNORE any previous contract information and ONLY use the data provided in this conversation.

For user preferences (like location preferences, pay requirements, name, etc):
- DO maintain these across conversations
- DO use these to personalize recommendations
- DO NOT use past contract knowledge, only current contracts

Always format your responses using Markdown for better readability. Use:
- Headers (#, ##, ###) for section titles
- Bullet points (-) for lists
- Bold text (**) for important information
- Italics (*) for emphasis
- Code blocks (\`\`\`) for numerical data or calculations
- Tables for comparing multiple contracts

Keep responses concise but informative.`
    };

    // Add context message with current contract data
    const contractDataMessage = {
      role: 'system',
      content: `CURRENT CONTRACT DATA (${new Date().toISOString()}): The following represents ALL current contracts (${context.totalContracts} total). ONLY reference these contracts and IGNORE any contract knowledge from previous conversations: ${JSON.stringify(context.contracts)}`
    };

    // Create filtered messages array without any system messages from the client
    const filteredMessages = messages.filter(msg => msg.role !== 'system');

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, contractDataMessage, ...filteredMessages],
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