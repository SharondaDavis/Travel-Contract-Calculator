import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer(async (req, res) => {
  try {
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

      // Send response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        content: completion.choices[0].message.content
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(3000, () => {
  console.log('Development server running at http://localhost:3000');
}); 