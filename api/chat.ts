import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, context, apiKey } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'OpenAI API key is required' });
    }

    const openai = new OpenAI({
      apiKey: apiKey
    });

    // Prepare the system message with contract context
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

    // Add the contract data as context with a clear header
    const contextMessage = {
      role: 'system',
      content: `CURRENT ACTIVE CONTRACTS (${context.totalContracts} total):
${JSON.stringify(context.contracts, null, 2)}

REMEMBER: These are the ONLY contracts that exist. Any contract not listed above has been either:
1. Renamed (in which case it will appear with its new name in the list above)
2. Removed completely (in which case it should not be referenced at all)`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, contextMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    return res.status(200).json({ content: response });
  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    return res.status(500).json({ error: 'Failed to process chat request' });
  }
} 