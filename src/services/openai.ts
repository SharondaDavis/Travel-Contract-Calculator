import { db } from '../storage/db';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContext {
  contracts: any[];
  totalContracts: number;
}

export async function chatWithOpenAI(messages: Message[], context: ChatContext): Promise<string> {
  try {
    // Get the API key from IndexedDB
    const settings = await db.settings.get('openai_api_key');
    if (!settings) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        context,
        apiKey: settings.value
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    throw error;
  }
} 