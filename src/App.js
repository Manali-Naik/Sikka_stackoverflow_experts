import React, { useState, useRef, useEffect } from 'react';
import { Send, Copy, RotateCcw, ThumbsUp, ThumbsDown, Image } from 'lucide-react';

const ChatMessage = ({ role, content, onCopy, onRetry }) => {
  const isAssistant = role === 'assistant';
  
  return (
    <div className={`flex w-full ${isAssistant ? 'bg-white' : 'bg-stone-50'} p-4 md:p-6 lg:p-8`}>
      <div className="max-w-3xl w-full mx-auto flex gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAssistant ? 'bg-blue-100 text-blue-600' : 'bg-stone-800 text-white'
        }`}>
          {isAssistant ? 'S' : 'M'}
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="prose max-w-none">
            {content}
          </div>
          
          {isAssistant && (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <button onClick={onCopy} className="flex items-center gap-1 hover:text-stone-700">
                <Copy size={16} /> Copy
              </button>
              <button onClick={onRetry} className="flex items-center gap-1 hover:text-stone-700">
                <RotateCcw size={16} /> Retry
              </button>
              <div className="flex items-center gap-1">
                <button className="hover:text-stone-700">
                  <ThumbsUp size={16} />
                </button>
                <button className="hover:text-stone-700">
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleRetry = async (index) => {
    const messageToRetry = messages[index - 1];
    if (!messageToRetry || messageToRetry.role !== 'user') return;

    // Remove all messages after the retry point
    setMessages(messages.slice(0, index));
    
    // Trigger a new response
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToRetry.content }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Chat header */}
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-2">
          <h1 className="text-lg font-semibold">Chat with Sikka App Builder</h1>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            {...message}
            onCopy={() => handleCopy(message.content)}
            onRetry={() => handleRetry(index + 1)}
          />
        ))}
        {isLoading && (
          <div className="flex w-full bg-white p-4 md:p-6 lg:p-8">
            <div className="max-w-3xl w-full mx-auto">
              <div className="animate-pulse flex gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                  <div className="h-4 bg-blue-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <button
              type="button"
              className="p-2 hover:bg-stone-100 rounded"
              onClick={() => {/* Handle image upload */}}
            >
              <Image size={20} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message Sikka App Builder..."
              className="flex-1 p-2 border rounded focus:outline-none focus:border-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;