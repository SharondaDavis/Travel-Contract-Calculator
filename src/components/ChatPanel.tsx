import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Assignment } from '../App';
import { chatWithOpenAI } from '../services/openai';
import { db } from '../storage/db';
import { SettingsPanel } from './SettingsPanel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean; // Add isLoading flag to indicate streaming status
}

interface ChatPanelProps {
  contracts: Assignment[];
  onClose: () => void;
}

const promptSuggestions = [
  {
    title: "Compare Contracts",
    prompt: "Can you compare these contracts and highlight the key differences in pay, benefits, and location?"
  },
  {
    title: "Calculate Net Income",
    prompt: "Help me calculate my potential net income after taxes and expenses for each contract."
  },
  {
    title: "Housing Options",
    prompt: "What are the housing options and costs in these locations? Which contract offers better housing stipends?"
  },
  {
    title: "Benefits Analysis",
    prompt: "Compare the benefits packages (health insurance, bonuses, etc.) between these contracts."
  },
  {
    title: "Negotiation Tips",
    prompt: "What aspects of these contracts might be negotiable? What should I ask for?"
  },
  {
    title: "Location Insights",
    prompt: "Tell me about the cost of living, safety, and quality of life in these locations."
  }
];

export function ChatPanel({ contracts, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Contract Assistant. I can help you analyze and compare your travel nursing contracts. What would you like to know?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastRequestRef = useRef<number>(0);

  // Prevent background scrolling when chat panel is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Add CSS for the gradient animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animate-gradient {
        background-size: 200% 200%;
        animation: gradient 2s ease infinite;
        opacity: 0.7;
      }
      .loading-message {
        position: relative;
        overflow: hidden;
      }
      .loading-message::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, #e0f2fe, #bfdbfe, #93c5fd, #bfdbfe, #e0f2fe);
        background-size: 200% 200%;
        animation: gradient 2s ease infinite;
        opacity: 0.7;
        border-radius: 0.5rem;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load messages from IndexedDB when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const existingMessages = await db.chat_messages.toArray();
        if (existingMessages.length === 0) {
          // Only initialize with welcome message if no messages exist
          const initialMessage = {
            role: 'assistant' as const,
            content: `# Welcome to Contract Assistant! 👋\n\nI have access to ${contracts.length} travel nurse contracts. I can help you:\n\n- Compare contracts\n- Analyze details\n- Answer questions about benefits\n- Calculate potential earnings\n- Provide negotiation tips\n\nWhat would you like to know?`
          };
          setMessages([initialMessage]);
          await db.chat_messages.add({
            role: 'assistant',
            content: initialMessage.content,
            timestamp: new Date()
          });
        } else {
          // Load existing messages
          setMessages(existingMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })));
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Initialize with welcome message if there's an error
        const initialMessage = {
          role: 'assistant' as const,
          content: `# Welcome to Contract Assistant! 👋\n\nI have access to ${contracts.length} travel nurse contracts. I can help you:\n\n- Compare contracts\n- Analyze details\n- Answer questions about benefits\n- Calculate potential earnings\n- Provide negotiation tips\n\nWhat would you like to know?`
        };
        setMessages([initialMessage]);
      }
    };

    loadMessages();
  }, []); // Remove contracts from dependencies

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add rate limiting
    const now = Date.now();
    if (now - lastRequestRef.current < 1000) { // 1 second cooldown
      return;
    }
    lastRequestRef.current = now;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Save user message to IndexedDB
      await db.chat_messages.add({
        role: 'user',
        content: input,
        timestamp: new Date()
      });

      // Create a temporary message for streaming updates with isLoading flag
      const tempMessage: Message = {
        role: 'assistant',
        content: '',
        isLoading: true
      };
      
      // Add the temporary message with loading state
      setMessages(prev => [...prev, tempMessage]);

      // Create a function to update the temporary message with streamed content
      const updateTempMessage = (content: string, stillLoading = false) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: content,
            isLoading: stillLoading
          };
          return newMessages;
        });
        
        scrollToBottom();
      };

      // Use streaming with callbacks
      await chatWithOpenAI(
        [...messages, userMessage],
        {
          contracts,
          totalContracts: contracts.length
        },
        {
          onChunk: (chunk) => {
            // For each chunk, update the temporary message
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              // Add the new chunk to the current content
              const currentContent = newMessages[lastIndex].content;
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: currentContent + chunk,
                isLoading: true // Keep loading state while streaming
              };
              return newMessages;
            });
            // Scroll to bottom with each update
            scrollToBottom();
          },
          onComplete: async (fullContent) => {
            // When complete, ensure we have the full content and remove loading state
            updateTempMessage(fullContent, false);
            
            // Save assistant message to IndexedDB
            await db.chat_messages.add({
              role: 'assistant',
              content: fullContent,
              timestamp: new Date()
            });
            
            setIsLoading(false);
          },
          onError: async (error) => {
            console.error('Streaming error:', error);
            
            let errorContent = '';
            if (error instanceof Error) {
              if (error.message === 'OpenAI API key not configured') {
                errorContent = 'To use the chat feature, you need to configure your OpenAI API key first. Would you like to do that now?';
                setShowSettings(true);
              } else {
                errorContent = error.message;
              }
            } else {
              errorContent = 'Sorry, I encountered an error. Please try again.';
            }
            
            // Update the temporary message with the error and remove loading state
            updateTempMessage(errorContent, false);
            
            // Save error message to IndexedDB
            await db.chat_messages.add({
              role: 'assistant',
              content: errorContent,
              timestamp: new Date()
            });
            
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      let errorContent = '';
      if (error instanceof Error) {
        if (error.message === 'OpenAI API key not configured') {
          errorContent = 'To use the chat feature, you need to configure your OpenAI API key first. Would you like to do that now?';
          setShowSettings(true);
        } else {
          errorContent = error.message;
        }
      } else {
        errorContent = 'Sorry, I encountered an error. Please try again.';
      }

      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);

      // Save error message to IndexedDB
      await db.chat_messages.add({
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      });
      
      setIsLoading(false);
    }
  }, [input, isLoading, messages, contracts, scrollToBottom]);

  return (
    <>
      <div className="fixed inset-0 bg-white flex flex-col z-50">
        <div className="flex-none p-4 border-b flex justify-between items-center bg-white shadow-sm">
          <h2 className="text-xl font-semibold">Contract Assistant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.isLoading && !message.content 
                      ? 'loading-message bg-gray-100 min-h-[60px] min-w-[100px]' 
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'user' ? (
                  message.content
                ) : message.content ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-200 rounded px-1">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-200 rounded p-2 overflow-x-auto">{children}</pre>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm z-10">thinking through this carefully...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-none p-4 border-t bg-white shadow-sm">
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                  title={suggestion.prompt}
                >
                  {suggestion.title}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your contracts..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </>
  );
} 