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
    console.log('Fetching API key from IndexedDB...');
    const settings = await db.settings.get('openai_api_key');
    console.log('API key settings:', settings);
    
    if (!settings) {
      console.error('No API key found in IndexedDB');
      throw new Error('OpenAI API key not configured');
    }

    if (!settings.value) {
      console.error('API key value is empty');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Making request to /api/chat...');
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

    // First check if the response is ok
    if (!response.ok) {
      let errorMessage = 'Failed to get response from OpenAI';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    // Try to parse the response as JSON
    let data;
    try {
      const text = await response.text();
      data = JSON.parse(text);
    } catch (e) {
      console.error('Error parsing response:', e);
      throw new Error('Invalid response format from server');
    }

    // Check if the response has the expected format
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from server');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.content) {
      throw new Error('No content in response from server');
    }

    return data.content;
  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    throw error;
  }
} 