import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NegotiationScenario {
  id: string;
  title: string;
  description: string;
  initialOffer: number;
  marketRate: number;
  context: string;
}

const SCENARIOS: NegotiationScenario[] = [
  {
    id: 'entry-level',
    title: 'Entry-Level Software Engineer',
    description: 'First job offer out of college',
    initialOffer: 70000,
    marketRate: 85000,
    context: 'You just graduated with a Computer Science degree. The company is a mid-sized tech startup. They initially offered $70,000, but you know the market rate for this role is around $85,000.',
  },
  {
    id: 'mid-career',
    title: 'Mid-Career Product Manager',
    description: 'Switching companies for growth',
    initialOffer: 110000,
    marketRate: 130000,
    context: 'You have 5 years of experience as a Product Manager. A Fortune 500 company has made you an offer of $110,000 plus benefits. Your research shows similar roles pay around $130,000.',
  },
  {
    id: 'senior-role',
    title: 'Senior Data Scientist',
    description: 'Being recruited by a competitor',
    initialOffer: 150000,
    marketRate: 175000,
    context: 'You\'re a senior data scientist with 8 years of experience. A competitor has offered you $150,000. You know your skills and experience are worth closer to $175,000 in the current market.',
  },
  {
    id: 'promotion',
    title: 'Internal Promotion',
    description: 'Moving up within your company',
    initialOffer: 95000,
    marketRate: 110000,
    context: 'You\'re being promoted from Associate to Senior Analyst within your current company. They\'ve offered a 10% raise to $95,000, but you know external hires for this position make around $110,000.',
  },
];

export function SalaryNegotiator() {
  const [selectedScenario, setSelectedScenario] = useState<NegotiationScenario | null>(null);
  const [round, setRound] = useState(0);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [conversation, setConversation] = useState<{ role: string; message: string; offer?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [negotiationComplete, setNegotiationComplete] = useState(false);
  const [finalOutcome, setFinalOutcome] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatbotInteractions, setChatbotInteractions] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const startNegotiation = (scenario: NegotiationScenario) => {
    setSelectedScenario(scenario);
    setRound(0);
    setCurrentOffer(scenario.initialOffer);
    setUserResponse('');
    setConversation([
      {
        role: 'employer',
        message: `We're excited to offer you the position! After reviewing your background, we'd like to offer you $${scenario.initialOffer.toLocaleString()} annually. What are your thoughts?`,
        offer: scenario.initialOffer,
      },
    ]);
    setNegotiationComplete(false);
    setFinalOutcome('');
    setChatbotInteractions(0);
  };

  const submitResponse = async () => {
    if (userResponse.trim().length < 20) {
      alert('Please provide a more detailed response (at least 20 characters).');
      return;
    }

    setLoading(true);
    const newConversation = [...conversation, { role: 'candidate', message: userResponse }];
    setConversation(newConversation);

    try {
      // Get AI response from employer
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": window.location.origin,
          "X-Title": "FuturePath Career Platform",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.2-3b-instruct",
          "provider": {
            "order": ["deepinfra"],
            "allow_fallbacks": true
          },
          "messages": [
            {
              "role": "system",
              "content": `You are a hiring manager in a salary negotiation. The initial offer was $${selectedScenario!.initialOffer.toLocaleString()}. The market rate is $${selectedScenario!.marketRate.toLocaleString()}. You have a budget up to $${selectedScenario!.marketRate.toLocaleString()} but want to stay lower if possible. Respond realistically to the candidate's negotiation. If they're being reasonable and professional, you can move up. If they're being aggressive or unreasonable, push back. After 3-4 rounds of negotiation, either accept their final request (if reasonable) or make a final offer. Keep responses to 2-3 sentences. If you make a new offer, state it clearly like "We can go up to $X". If you're ending negotiation, say "This is our final offer" or "We accept your request".`
            },
            {
              "role": "user",
              "content": `Round ${round + 1} of negotiation.\\n\\nContext: ${selectedScenario!.context}\\n\\nConversation so far:\\n${newConversation.map(c => `${c.role}: ${c.message}`).join('\\n')}\\n\\nRespond as the hiring manager.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const employerMessage = data.choices?.[0]?.message?.content || "Let me discuss this with our team and get back to you.";
        
        // Track chatbot interaction
        const newInteractions = chatbotInteractions + 1;
        setChatbotInteractions(newInteractions);
        
        if (isAuthenticated) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const { projectId } = await import('../../../utils/supabase/info');
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/add-xp`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  xp_amount: 3 // 3 XP per chatbot interaction
                }),
              }
            );
          }
        }

        // Extract offer from message if present
        const offerMatch = employerMessage.match(/\$(\d{1,3}(,\d{3})*)/);
        let newOffer = currentOffer;
        if (offerMatch) {
          newOffer = parseInt(offerMatch[1].replace(/,/g, ''));
          setCurrentOffer(newOffer);
        }

        const employerResponse = {
          role: 'employer',
          message: employerMessage,
          offer: newOffer !== currentOffer ? newOffer : undefined,
        };

        setConversation([...newConversation, employerResponse]);

        // Check if negotiation is ending
        if (
          employerMessage.toLowerCase().includes('final offer') ||
          employerMessage.toLowerCase().includes('we accept') ||
          round >= 3
        ) {
          await completeNegotiation([...newConversation, employerResponse], newOffer);
        } else {
          setRound(round + 1);
          setUserResponse('');
        }
      }
    } catch (error) {
      console.error('Error in negotiation:', error);
      setConversation([
        ...newConversation,
        { role: 'employer', message: 'Let me discuss this internally and get back to you.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const completeNegotiation = async (finalConversation: any[], finalOffer: number) => {
    setNegotiationComplete(true);
    setLoading(true);

    // Calculate outcome
    const percentageOfTarget = (finalOffer / selectedScenario!.marketRate) * 100;
    let outcome = '';
    
    if (percentageOfTarget >= 95) {
      outcome = 'Excellent! You negotiated very close to market rate.';
    } else if (percentageOfTarget >= 85) {
      outcome = 'Good job! You successfully negotiated a higher salary.';
    } else if (percentageOfTarget >= 75) {
      outcome = 'Fair outcome. There was room for more negotiation.';
    } else {
      outcome = 'You left money on the table. Consider being more assertive.';
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "HTTP-Referer": window.location.origin,
          "X-Title": "FuturePath Career Platform",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "meta-llama/llama-3.2-3b-instruct",
          "provider": {
            "order": ["deepinfra"],
            "allow_fallbacks": true
          },
          "messages": [
            {
              "role": "system",
              "content": "You are a career coach providing feedback on salary negotiation performance. Be constructive and specific. Provide 3-4 actionable tips."
            },
            {
              "role": "user",
              "content": `A candidate negotiated their salary from $${selectedScenario!.initialOffer.toLocaleString()} to $${finalOffer.toLocaleString()}. The market rate was $${selectedScenario!.marketRate.toLocaleString()}. They achieved ${percentageOfTarget.toFixed(0)}% of market rate. Provide feedback on their negotiation approach and tips for improvement.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFinalOutcome(data.choices?.[0]?.message?.content || outcome);
      } else {
        setFinalOutcome(outcome);
      }
    } catch (error) {
      setFinalOutcome(outcome);
    } finally {
      setLoading(false);
    }

    // Award game completion XP
    if (isAuthenticated) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { projectId } = await import('../../../utils/supabase/info');
          
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/add-xp`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                xp_amount: 15 // 15 XP for game completion
              }),
            }
          );

          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/increment-game`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          );
        }
      } catch (error) {
        console.error('Error tracking game completion:', error);
      }
    }
  };

  const resetGame = () => {
    setSelectedScenario(null);
    setRound(0);
    setCurrentOffer(0);
    setUserResponse('');
    setConversation([]);
    setNegotiationComplete(false);
    setFinalOutcome('');
    setChatbotInteractions(0);
  };

  const getOfferStatus = () => {
    if (!selectedScenario) return null;
    const percentage = (currentOffer / selectedScenario.marketRate) * 100;
    
    if (percentage >= 95) {
      return { icon: TrendingUp, color: 'text-green-600', text: 'Excellent offer!', bgColor: 'bg-green-50' };
    } else if (percentage >= 85) {
      return { icon: TrendingUp, color: 'text-blue-600', text: 'Good progress', bgColor: 'bg-blue-50' };
    } else if (percentage >= 75) {
      return { icon: Minus, color: 'text-yellow-600', text: 'Room for improvement', bgColor: 'bg-yellow-50' };
    } else {
      return { icon: TrendingDown, color: 'text-red-600', text: 'Below market rate', bgColor: 'bg-red-50' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl mb-4">Salary Negotiator</h1>
          <p className="text-xl text-gray-600">
            Practice negotiating your salary with AI-powered scenarios
          </p>
        </motion.div>

        {!selectedScenario && (
          <div className="space-y-6">
            <Card className="p-8 border-2 border-black/10">
              <h2 className="text-2xl mb-4">Choose Your Scenario</h2>
              <p className="text-gray-700 mb-6">
                Select a negotiation scenario to practice. Each scenario has a different context, initial offer, and market rate. Your goal is to negotiate the best possible salary!
              </p>
            </Card>

            {SCENARIOS.map((scenario) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                  className="p-6 border-2 border-black/10 hover:border-[#D4AF37] transition-all cursor-pointer"
                  onClick={() => startNegotiation(scenario)}
                >
                  <div className="flex items-start gap-4">
                    <DollarSign className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl mb-2">{scenario.title}</h3>
                      <p className="text-gray-600 mb-3">{scenario.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-500">
                          Initial: <strong>${scenario.initialOffer.toLocaleString()}</strong>
                        </span>
                        <span className="text-gray-500">
                          Market: <strong>${scenario.marketRate.toLocaleString()}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {selectedScenario && !negotiationComplete && (
          <div className="space-y-6">
            {/* Current Offer Status */}
            <Card className={`p-6 border-2 ${getOfferStatus()?.bgColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg mb-2">Current Offer</h3>
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    ${currentOffer.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Market Rate: ${selectedScenario.marketRate.toLocaleString()}
                  </p>
                </div>
                <div className={`flex items-center gap-2 ${getOfferStatus()?.color}`}>
                  {getOfferStatus() && (
                    <>
                      {(() => {
                        const Icon = getOfferStatus()!.icon;
                        return <Icon className="w-8 h-8" />;
                      })()}
                      <span className="font-semibold">{getOfferStatus()?.text}</span>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {/* Conversation History */}
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <Card 
                  key={index}
                  className={`p-6 ${
                    msg.role === 'employer' 
                      ? 'border-2 border-blue-500 bg-blue-50 ml-8' 
                      : 'border-2 border-[#D4AF37] bg-[#D4AF37]/5 mr-8'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold mb-2 capitalize">{msg.role}</p>
                      <p className="text-gray-700">{msg.message}</p>
                      {msg.offer && (
                        <p className="mt-2 text-sm font-semibold text-[#D4AF37]">
                          Offer: ${msg.offer.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* User Input */}
            <Card className="p-6 border-2 border-[#D4AF37]">
              <h3 className="text-lg mb-4">Your Response</h3>
              <Textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Type your negotiation response here... Be professional, confident, and specific about your value."
                className="min-h-[150px] mb-4 border-black/20 focus:border-[#D4AF37]"
                disabled={loading}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {userResponse.length} characters (minimum 20)
                </p>
                <Button
                  onClick={submitResponse}
                  disabled={userResponse.trim().length < 20 || loading}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  {loading ? 'Processing...' : 'Send Response'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {negotiationComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="p-8 border-2 border-green-500 bg-green-50">
              <h2 className="text-3xl mb-6">Negotiation Complete!</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Initial Offer</p>
                  <p className="text-2xl font-bold">${selectedScenario!.initialOffer.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Final Offer</p>
                  <p className="text-2xl font-bold text-[#D4AF37]">${currentOffer.toLocaleString()}</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Market Rate</p>
                  <p className="text-2xl font-bold text-green-600">${selectedScenario!.marketRate.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Increase</p>
                <p className="text-3xl font-bold text-[#D4AF37]">
                  ${(currentOffer - selectedScenario!.initialOffer).toLocaleString()}
                  <span className="text-lg ml-2">
                    ({(((currentOffer - selectedScenario!.initialOffer) / selectedScenario!.initialOffer) * 100).toFixed(1)}%)
                  </span>
                </p>
              </div>

              {loading ? (
                <p className="text-gray-600">Generating your feedback...</p>
              ) : (
                <div className="bg-white p-6 rounded-lg border-2 border-[#D4AF37]">
                  <h3 className="font-semibold mb-3 text-lg">Negotiation Coach Feedback</h3>
                  <p className="text-gray-700 whitespace-pre-line">{finalOutcome}</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg mt-6">
                <p className="text-sm text-gray-600">
                  <strong>XP Earned:</strong> {chatbotInteractions * 3} XP from negotiation + 15 XP completion bonus = {chatbotInteractions * 3 + 15} XP total
                </p>
              </div>
            </Card>

            {/* Full Conversation */}
            <h3 className="text-2xl">Full Conversation</h3>
            <div className="space-y-4">
              {conversation.map((msg, index) => (
                <Card 
                  key={index}
                  className={`p-6 ${
                    msg.role === 'employer' 
                      ? 'border-2 border-blue-500 bg-blue-50 ml-8' 
                      : 'border-2 border-[#D4AF37] bg-[#D4AF37]/5 mr-8'
                  }`}
                >
                  <p className="font-semibold mb-2 capitalize">{msg.role}</p>
                  <p className="text-gray-700">{msg.message}</p>
                  {msg.offer && (
                    <p className="mt-2 text-sm font-semibold text-[#D4AF37]">
                      Offer: ${msg.offer.toLocaleString()}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetGame}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
              >
                Practice Another Scenario
              </Button>
              <Button
                onClick={() => window.location.href = '/games'}
                variant="outline"
                className="border-2 border-black/20 hover:border-black/40"
              >
                Back to Games
              </Button>
            </div>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}