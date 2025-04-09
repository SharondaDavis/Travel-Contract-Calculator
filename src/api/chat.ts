import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { db } from '../storage/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the API key from IndexedDB
    const settings = await db.settings.get('openai_api_key');
    if (!settings) {
      return res.status(401).json({ error: 'OpenAI API key not configured' });
    }

    const openai = new OpenAI({
      apiKey: settings.value,
    });

    const { messages, context } = req.body;

    // Prepare the system message with contract context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful assistant specialized in travel nurse contracts. You have access to ${context.totalContracts} contracts with detailed information about facilities, rates, benefits, and other important factors. Use this information to help the user make informed decisions about their travel nursing opportunities.`
    };

    // Add the contract data as context
    const contextMessage = {
      role: 'system',
      content: `Here is the contract data: ${JSON.stringify(context.contracts)}`
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, contextMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;

    res.status(200).json({ content: response });
  } catch (error) {
    console.error('Error in chat API:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
} 