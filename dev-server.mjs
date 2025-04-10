import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Handle status endpoint
    if (req.url === '/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Handle activities endpoint
    if (req.url === '/chat/activities' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ activities: [] }));
      return;
    }

    // Handle chat endpoint
    if (req.url === '/chat' && req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString());
      
      // Check for OpenAI API key
      if (!body.apiKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'OpenAI API key is required' }));
        return;
      }

      const openai = new OpenAI({
        apiKey: body.apiKey
      });

      // Construct system message
      const systemMessage = {
        role: 'system',
        content: `You are a helpful assistant for travel nurses. You have access to the following contract information:
        ${JSON.stringify(body.context?.contracts || {}, null, 2)}
        
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

      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        });

        const response = completion.choices[0].message.content;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ content: response }));
      } catch (error) {
        console.error('OpenAI API error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to get response from OpenAI' }));
      }
      return;
    }

    // Handle 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}`);
}); 