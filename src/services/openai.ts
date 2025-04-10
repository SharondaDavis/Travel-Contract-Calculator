import { db } from '../storage/db';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContext {
  contracts: any[];
  totalContracts: number;
}

type StreamCallbacks = {
  onChunk: (chunk: string) => void;
  onComplete: (fullContent: string) => void;
  onError: (error: Error) => void;
};

export async function chatWithOpenAI(
  messages: Message[], 
  context: ChatContext, 
  streamCallbacks?: StreamCallbacks
): Promise<string> {
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

    // If streaming callbacks are provided, use streaming
    const useStreaming = !!streamCallbacks;

    console.log('Making request to /api/chat...');
    
    if (useStreaming) {
      // Streaming implementation using fetch
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context,
          apiKey: settings.value,
          stream: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to get response from OpenAI');
        } catch (e) {
          console.error('Error parsing error response:', e);
          throw new Error(`Server error: ${response.status} ${errorText}`);
        }
      }

      // Check for text/event-stream content type
      const contentType = response.headers.get('Content-Type');
      
      // If the server returned JSON instead of a stream, handle it normally
      if (contentType && contentType.includes('application/json')) {
        console.log('Server returned JSON instead of a stream, handling as normal response');
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        try {
          const data = JSON.parse(responseText);
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (data.content) {
            // Simulate streaming by sending the full content as smaller chunks
            const content = data.content;
            console.log('Simulating streaming response with content length:', content.length);
            
            // Split the content into chunks of ~10 characters
            // In a real streaming scenario, we would receive natural breaks in the tokens
            const chunks = [];
            const chunkSize = 10;  // Small for testing, increase for production
            for (let i = 0; i < content.length; i += chunkSize) {
              chunks.push(content.slice(i, i + chunkSize));
            }
            
            // Send each chunk with a small delay to simulate streaming
            let accumulatedContent = '';
            for (const chunk of chunks) {
              accumulatedContent += chunk;
              streamCallbacks.onChunk(chunk);
              // Small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            // Signal completion when done
            streamCallbacks.onComplete(content);
            return content;
          } else {
            throw new Error('No content in response from server');
          }
        } catch (e) {
          console.error('Error parsing JSON response:', e);
          streamCallbacks.onError(e instanceof Error ? e : new Error('Invalid JSON response'));
          throw e;
        }
      }
      
      // If not text/event-stream and not application/json, report an error
      if (!contentType || !contentType.includes('text/event-stream')) {
        console.error('Invalid content type for streaming', contentType);
        throw new Error('Server did not return a proper stream or valid JSON');
      }

      let fullContent = '';
      
      // Get the reader from the response body stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get stream reader');
      }

      // Create a text decoder
      const decoder = new TextDecoder();
      
      // Process the stream
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process any complete events in the buffer
          let eventIndex;
          while ((eventIndex = buffer.indexOf('\n\n')) >= 0) {
            const eventData = buffer.substring(0, eventIndex).trim();
            buffer = buffer.substring(eventIndex + 2);
            
            if (eventData && eventData.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(eventData.substring(6));
                
                if (jsonData.type === 'chunk' && jsonData.content) {
                  fullContent += jsonData.content;
                  streamCallbacks.onChunk(jsonData.content);
                } else if (jsonData.type === 'end') {
                  // Stream completed
                  streamCallbacks.onComplete(jsonData.content || fullContent);
                  return fullContent;
                } else if (jsonData.type === 'error') {
                  throw new Error(jsonData.error || 'Stream error');
                }
              } catch (e) {
                console.error('Error parsing stream data:', e, eventData);
                // Continue processing other events even if one fails
              }
            }
          }
        }
        
        // If we reach here without an 'end' event, send whatever content we have
        streamCallbacks.onComplete(fullContent);
        return fullContent;
      } catch (error) {
        console.error('Stream processing error:', error);
        streamCallbacks.onError(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        reader.releaseLock();
      }
    } else {
      // Non-streaming implementation (existing code)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          context,
          apiKey: settings.value,
          stream: false
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
    }
  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    throw error;
  }
} 