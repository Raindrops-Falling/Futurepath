import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { Send, Bot, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Career Assistant. I can help you with career planning, resume advice, interview preparation, and job search strategies. What would you like to discuss today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call OpenRouter API with Llama model
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": window.location.origin,
          "X-Title": "FuturePath Career Assistant",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.2-3b-instruct",
          "messages": [
            {
              "role": "system",
              "content": "You are a helpful career assistant specializing in resume writing, job applications, interview preparation, career planning, and professional development. Provide practical, actionable advice in a friendly and supportive tone."
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            {
              "role": "user",
              "content": input
            }
          ],
          "provider": {
            "order": ["deepinfra"],
            "allow_fallbacks": true
          }
        })
      });

     if (!response.ok) {
        const errorText = await response.text(); // or response.json()
        throw new Error(`Request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const aiContent = data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';

      const aiResponse: Message = {
        role: 'assistant',
        content: aiContent
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/games">
            <Button variant="outline" className="mb-4 border-black/20 hover:border-[#D4AF37]">
              ← Back to Games
            </Button>
          </Link>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl mb-4"
          >
            AI Career Chatbot
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            Get personalized career guidance powered by AI
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-[600px] flex flex-col border-2 border-black/10">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#D4AF37] text-white'
                        : 'bg-gray-100 text-black'
                    }`}
                  >
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about careers..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}