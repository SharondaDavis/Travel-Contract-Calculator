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

    // Get the response text first
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing response:', e);
      console.error('Response text:', responseText);
      throw new Error('Invalid response format from server');
    }

    // Check if the response is not ok
    if (!response.ok) {
      const errorMessage = data?.error || data?.details || 'Failed to get response from OpenAI';
      console.error('API Error:', data);
      throw new Error(errorMessage);
    }

    // Check if the response has the expected format
    if (!data || typeof data !== 'object') {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }

    if (data.error) {
      console.error('API returned error:', data);
      throw new Error(data.error);
    }

    if (!data.content) {
      console.error('No content in response:', data);
      throw new Error('No content in response from server');
    }

    return data.content;
  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    throw error;
  }
} 