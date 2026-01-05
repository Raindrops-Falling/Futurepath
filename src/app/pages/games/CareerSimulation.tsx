import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, Briefcase, Target } from 'lucide-react';

interface Attributes {
  skills: number;
  relationships: number;
  reputation: number;
  workLifeBalance: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  choices: {
    text: string;
    effects: Partial<Attributes>;
  }[];
}

const EVENTS: Event[] = [
  {
    id: 1,
    title: "New Project Assignment",
    description: "Your manager offers you a high-visibility project that requires weekend work for the next month.",
    choices: [
      { text: "Accept enthusiastically", effects: { reputation: 15, skills: 10, workLifeBalance: -20 } },
      { text: "Accept with boundaries", effects: { reputation: 5, skills: 10, workLifeBalance: -5 } },
      { text: "Politely decline", effects: { workLifeBalance: 10, reputation: -10 } },
    ],
  },
  {
    id: 2,
    title: "Networking Event",
    description: "An industry networking event is happening this weekend. Attendance is optional but could be valuable.",
    choices: [
      { text: "Attend and network actively", effects: { relationships: 20, skills: 5, workLifeBalance: -10 } },
      { text: "Skip to rest", effects: { workLifeBalance: 15 } },
      { text: "Attend briefly then leave", effects: { relationships: 10, workLifeBalance: -5 } },
    ],
  },
  {
    id: 3,
    title: "Skill Development Opportunity",
    description: "A certification course is available that would boost your skills but requires evening study.",
    choices: [
      { text: "Enroll immediately", effects: { skills: 25, workLifeBalance: -15 } },
      { text: "Wait for a better time", effects: { workLifeBalance: 5 } },
      { text: "Request company support", effects: { skills: 20, relationships: 5, workLifeBalance: -10 } },
    ],
  },
  {
    id: 4,
    title: "Team Conflict",
    description: "Two team members are in conflict and it's affecting productivity. They both approach you for support.",
    choices: [
      { text: "Mediate directly", effects: { relationships: 15, reputation: 10, skills: 5 } },
      { text: "Report to management", effects: { reputation: 5, relationships: -10 } },
      { text: "Stay neutral", effects: { relationships: -5, reputation: -5 } },
    ],
  },
  {
    id: 5,
    title: "Remote Work Opportunity",
    description: "Your company is offering permanent remote work. This would improve work-life balance but reduce face time.",
    choices: [
      { text: "Go fully remote", effects: { workLifeBalance: 25, relationships: -10 } },
      { text: "Stay in office", effects: { relationships: 10, workLifeBalance: -10 } },
      { text: "Request hybrid model", effects: { workLifeBalance: 15, relationships: 5 } },
    ],
  },
  {
    id: 6,
    title: "Mentor Opportunity",
    description: "A junior colleague asks you to be their mentor. It's a time commitment but could be rewarding.",
    choices: [
      { text: "Accept and commit fully", effects: { relationships: 20, reputation: 15, workLifeBalance: -15 } },
      { text: "Decline politely", effects: { workLifeBalance: 5, reputation: -5 } },
      { text: "Offer limited mentoring", effects: { relationships: 10, reputation: 5, workLifeBalance: -5 } },
    ],
  },
  {
    id: 7,
    title: "Budget Cuts",
    description: "Your department is facing budget cuts. You need to decide how to allocate limited resources.",
    choices: [
      { text: "Protect team jobs", effects: { relationships: 20, reputation: 10, skills: -5 } },
      { text: "Invest in technology", effects: { skills: 15, relationships: -10 } },
      { text: "Distribute evenly", effects: { reputation: 5 } },
    ],
  },
  {
    id: 8,
    title: "Promotion Opportunity",
    description: "A management position opens up. It pays more but requires longer hours and more stress.",
    choices: [
      { text: "Apply immediately", effects: { reputation: 15, skills: 10, workLifeBalance: -20 } },
      { text: "Stay in current role", effects: { workLifeBalance: 10 } },
      { text: "Negotiate terms first", effects: { reputation: 10, relationships: 5, workLifeBalance: -10 } },
    ],
  },
  {
    id: 9,
    title: "Industry Conference",
    description: "You're invited to speak at a major industry conference. It's prestigious but time-consuming to prepare.",
    choices: [
      { text: "Accept and prepare thoroughly", effects: { reputation: 25, skills: 10, workLifeBalance: -20 } },
      { text: "Decline the invitation", effects: { workLifeBalance: 10, reputation: -10 } },
      { text: "Accept with minimal prep", effects: { reputation: 10, workLifeBalance: -5 } },
    ],
  },
  {
    id: 10,
    title: "New Technology Adoption",
    description: "Your company is adopting new technology. You can lead the transition or follow along.",
    choices: [
      { text: "Lead the transition", effects: { skills: 20, reputation: 15, workLifeBalance: -15 } },
      { text: "Learn at your own pace", effects: { skills: 10, workLifeBalance: 5 } },
      { text: "Resist the change", effects: { workLifeBalance: 10, reputation: -15 } },
    ],
  },
  {
    id: 11,
    title: "Team Building Event",
    description: "Your manager is organizing a team retreat during the weekend. Attendance is 'strongly encouraged.'",
    choices: [
      { text: "Attend and participate fully", effects: { relationships: 20, reputation: 10, workLifeBalance: -15 } },
      { text: "Attend but leave early", effects: { relationships: 10, reputation: 5, workLifeBalance: -5 } },
      { text: "Skip with valid excuse", effects: { workLifeBalance: 15, relationships: -10 } },
    ],
  },
  {
    id: 12,
    title: "Work Emergency",
    description: "A critical system failure happens during your vacation. The team needs your expertise.",
    choices: [
      { text: "Return to fix it", effects: { reputation: 20, skills: 5, workLifeBalance: -25 } },
      { text: "Provide remote guidance", effects: { reputation: 10, relationships: 5, workLifeBalance: -10 } },
      { text: "Trust team to handle it", effects: { workLifeBalance: 10, reputation: -15 } },
    ],
  },
  {
    id: 13,
    title: "Side Project Opportunity",
    description: "A friend offers you a lucrative side consulting gig that could boost your income and skills.",
    choices: [
      { text: "Accept and moonlight", effects: { skills: 15, workLifeBalance: -20 } },
      { text: "Decline to focus on main job", effects: { workLifeBalance: 10, reputation: 5 } },
      { text: "Discuss with employer first", effects: { relationships: 10, reputation: 5 } },
    ],
  },
  {
    id: 14,
    title: "Performance Review",
    description: "It's performance review time. You can be honest about workload or stay quiet to avoid conflict.",
    choices: [
      { text: "Be completely honest", effects: { reputation: 5, relationships: 10, workLifeBalance: 10 } },
      { text: "Downplay concerns", effects: { reputation: 10, workLifeBalance: -5 } },
      { text: "Focus on achievements only", effects: { reputation: 15, relationships: -5 } },
    ],
  },
  {
    id: 15,
    title: "Difficult Client",
    description: "A major client is being unreasonable with demands. How do you handle it?",
    choices: [
      { text: "Accommodate all demands", effects: { reputation: 15, workLifeBalance: -20 } },
      { text: "Push back professionally", effects: { reputation: 10, skills: 10, workLifeBalance: 5 } },
      { text: "Escalate to management", effects: { relationships: 5, reputation: -5 } },
    ],
  },
  {
    id: 16,
    title: "Innovation Initiative",
    description: "You have an idea that could transform your department but requires significant time investment.",
    choices: [
      { text: "Pursue it fully", effects: { skills: 25, reputation: 20, workLifeBalance: -25 } },
      { text: "Abandon the idea", effects: { workLifeBalance: 10 } },
      { text: "Propose it to team", effects: { skills: 15, relationships: 10, workLifeBalance: -10 } },
    ],
  },
  {
    id: 17,
    title: "Office Politics",
    description: "You notice your colleague taking credit for your work in a meeting. What do you do?",
    choices: [
      { text: "Confront them directly", effects: { reputation: 10, relationships: -10 } },
      { text: "Document and report", effects: { reputation: 15, relationships: -5 } },
      { text: "Let it go", effects: { workLifeBalance: 5, reputation: -10 } },
    ],
  },
  {
    id: 18,
    title: "Salary Negotiation",
    description: "It's time for your annual review. You're underpaid compared to market rate.",
    choices: [
      { text: "Negotiate aggressively", effects: { reputation: 10, relationships: -5 } },
      { text: "Accept current offer", effects: { relationships: 10, reputation: -5 } },
      { text: "Research and present data", effects: { reputation: 15, skills: 10 } },
    ],
  },
  {
    id: 19,
    title: "Team Leadership",
    description: "Your manager is absent and someone needs to lead the team through a crisis.",
    choices: [
      { text: "Step up and lead", effects: { reputation: 20, relationships: 15, workLifeBalance: -15 } },
      { text: "Wait for direction", effects: { workLifeBalance: 5, reputation: -10 } },
      { text: "Collaborate with peers", effects: { relationships: 15, reputation: 10, workLifeBalance: -5 } },
    ],
  },
  {
    id: 20,
    title: "Industry Disruption",
    description: "New technology threatens to make your current skills obsolete. How do you respond?",
    choices: [
      { text: "Aggressively upskill", effects: { skills: 30, workLifeBalance: -25 } },
      { text: "Gradual transition", effects: { skills: 15, workLifeBalance: -10 } },
      { text: "Rely on existing expertise", effects: { workLifeBalance: 10, skills: -10 } },
    ],
  },
  {
    id: 21,
    title: "Work-Life Boundary",
    description: "Your manager expects immediate responses to late-night emails. How do you handle this?",
    choices: [
      { text: "Always respond immediately", effects: { reputation: 15, workLifeBalance: -25 } },
      { text: "Set clear boundaries", effects: { workLifeBalance: 20, reputation: -5 } },
      { text: "Respond selectively", effects: { reputation: 5, workLifeBalance: 5 } },
    ],
  },
  {
    id: 22,
    title: "Cross-Functional Project",
    description: "You're invited to join a cross-functional project with high visibility but extra workload.",
    choices: [
      { text: "Join enthusiastically", effects: { skills: 20, relationships: 15, workLifeBalance: -20 } },
      { text: "Decline politely", effects: { workLifeBalance: 15, reputation: -10 } },
      { text: "Negotiate reduced hours", effects: { skills: 10, relationships: 5, workLifeBalance: -5 } },
    ],
  },
  {
    id: 23,
    title: "Feedback to Leadership",
    description: "You're asked for honest feedback about a failing company initiative led by senior leadership.",
    choices: [
      { text: "Give honest critique", effects: { reputation: 10, relationships: 5, skills: 5 } },
      { text: "Provide only positives", effects: { reputation: -5, relationships: 10 } },
      { text: "Offer constructive suggestions", effects: { reputation: 15, relationships: 10, skills: 10 } },
    ],
  },
  {
    id: 24,
    title: "Burnout Warning",
    description: "You're feeling burnt out but have critical deliverables coming up. What's your approach?",
    choices: [
      { text: "Push through", effects: { reputation: 10, workLifeBalance: -30 } },
      { text: "Request time off", effects: { workLifeBalance: 25, reputation: -10 } },
      { text: "Delegate and pace yourself", effects: { workLifeBalance: 10, relationships: 10, reputation: 5 } },
    ],
  },
  {
    id: 25,
    title: "Diverse Hiring",
    description: "You're on a hiring committee. One candidate is less experienced but brings needed diversity.",
    choices: [
      { text: "Advocate for experience", effects: { reputation: 5, skills: 5 } },
      { text: "Advocate for diversity", effects: { relationships: 15, reputation: 10 } },
      { text: "Propose training program", effects: { relationships: 20, reputation: 15, skills: 10 } },
    ],
  },
  {
    id: 26,
    title: "Ethical Dilemma",
    description: "You discover your company is cutting corners that could harm customers, but speaking up could cost your job.",
    choices: [
      { text: "Speak up internally", effects: { reputation: 15, relationships: 10, workLifeBalance: -10 } },
      { text: "Report externally", effects: { reputation: 5, relationships: -20, workLifeBalance: -15 } },
      { text: "Stay quiet", effects: { workLifeBalance: 5, reputation: -20 } },
    ],
  },
  {
    id: 27,
    title: "Recognition Opportunity",
    description: "Your team accomplished something great. Who gets the credit in the company newsletter?",
    choices: [
      { text: "Take credit yourself", effects: { reputation: 15, relationships: -15 } },
      { text: "Credit the whole team", effects: { relationships: 25, reputation: 10 } },
      { text: "Credit specific contributors", effects: { relationships: 20, reputation: 15 } },
    ],
  },
  {
    id: 28,
    title: "Career Pivot",
    description: "An opportunity in a different department aligns with your interests but is a lateral move.",
    choices: [
      { text: "Take the pivot", effects: { skills: 20, workLifeBalance: 10, reputation: -5 } },
      { text: "Stay for promotion", effects: { reputation: 10, workLifeBalance: -10 } },
      { text: "Negotiate hybrid role", effects: { skills: 15, relationships: 10, reputation: 5 } },
    ],
  },
  {
    id: 29,
    title: "Company Downsizing",
    description: "Your company is downsizing and you must recommend who to lay off from your team.",
    choices: [
      { text: "Keep high performers", effects: { reputation: 10, relationships: -15, skills: 10 } },
      { text: "Keep those with families", effects: { relationships: 20, reputation: 5, skills: -5 } },
      { text: "Spread the impact evenly", effects: { relationships: 5, reputation: 10 } },
    ],
  },
  {
    id: 30,
    title: "Final Career Move",
    description: "You receive a competitive offer from another company. It pays more but has uncertain culture.",
    choices: [
      { text: "Take the new offer", effects: { skills: 15, workLifeBalance: 10, relationships: -20 } },
      { text: "Stay at current company", effects: { relationships: 20, reputation: 15 } },
      { text: "Counter-offer negotiation", effects: { reputation: 20, skills: 10, relationships: 10 } },
    ],
  },
];

export function CareerSimulation() {
  const [currentEvent, setCurrentEvent] = useState(0);
  const [attributes, setAttributes] = useState<Attributes>({
    skills: 50,
    relationships: 50,
    reputation: 50,
    workLifeBalance: 50,
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const handleChoice = async (effects: Partial<Attributes>) => {
    const newAttributes = { ...attributes };
    Object.keys(effects).forEach((key) => {
      const attrKey = key as keyof Attributes;
      newAttributes[attrKey] = Math.max(0, Math.min(100, newAttributes[attrKey] + (effects[attrKey] || 0)));
    });
    setAttributes(newAttributes);

    if (currentEvent < EVENTS.length - 1) {
      setCurrentEvent(currentEvent + 1);
    } else {
      setGameComplete(true);
      await generateFeedback(newAttributes);
      
      // Award XP for game completion
      if (isAuthenticated) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const { projectId } = await import('../../../utils/supabase/info');
            
            // Add 15 XP for game completion
            await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/add-xp`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  xp_amount: 15
                }),
              }
            );

            // Increment games played
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
    }
  };

  const generateFeedback = async (finalAttributes: Attributes) => {
    setLoadingFeedback(true);
    
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
              "content": "You are a career development coach. Provide encouraging yet honest feedback on career simulation results. Keep feedback to 3-4 sentences with specific actionable advice."
            },
            {
              "role": "user",
              "content": `A user completed a career simulation with these final attributes:
Skills: ${finalAttributes.skills}/100
Relationships: ${finalAttributes.relationships}/100
Reputation: ${finalAttributes.reputation}/100
Work-Life Balance: ${finalAttributes.workLifeBalance}/100

Provide constructive feedback on their career decisions and areas for improvement.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.choices?.[0]?.message?.content || 'Great job completing the simulation!');
      } else {
        setFeedback('Great job completing the simulation! Reflect on your decisions and how they impacted your attributes.');
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback('Great job completing the simulation! Reflect on your decisions and how they impacted your attributes.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const resetGame = () => {
    setCurrentEvent(0);
    setAttributes({
      skills: 50,
      relationships: 50,
      reputation: 50,
      workLifeBalance: 50,
    });
    setGameStarted(false);
    setGameComplete(false);
    setFeedback('');
  };

  const attributeIcons = {
    skills: Target,
    relationships: Users,
    reputation: TrendingUp,
    workLifeBalance: Briefcase,
  };

  const attributeLabels = {
    skills: 'Skills',
    relationships: 'Relationships',
    reputation: 'Reputation',
    workLifeBalance: 'Work-Life Balance',
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
          <h1 className="text-5xl mb-4">Career Simulation Game</h1>
          <p className="text-xl text-gray-600">
            Navigate 30 career scenarios and build your professional success
          </p>
        </motion.div>

        {!gameStarted && !gameComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 border-2 border-black/10">
              <h2 className="text-2xl mb-4">How to Play</h2>
              <div className="space-y-4 text-gray-700 mb-8">
                <p>You'll face 30 realistic career scenarios, each with multiple choices.</p>
                <p>Your decisions will affect four key attributes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Skills:</strong> Your technical and professional capabilities</li>
                  <li><strong>Relationships:</strong> Your network and team connections</li>
                  <li><strong>Reputation:</strong> How you're perceived in your organization</li>
                  <li><strong>Work-Life Balance:</strong> Your personal wellbeing</li>
                </ul>
                <p className="mt-4">There are no wrong answers—each choice reflects different priorities and approaches to career development. At the end, you'll receive AI-powered feedback on your decisions.</p>
              </div>
              <Button
                onClick={() => setGameStarted(true)}
                className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-white"
              >
                Start Simulation
              </Button>
            </Card>
          </motion.div>
        )}

        {gameStarted && !gameComplete && (
          <div className="space-y-6">
            {/* Attributes Display */}
            <Card className="p-6 border-2 border-black/10">
              <h3 className="text-lg mb-4">Your Attributes</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(attributes).map(([key, value]) => {
                  const Icon = attributeIcons[key as keyof Attributes];
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm">{attributeLabels[key as keyof Attributes]}</span>
                        <span className="ml-auto text-sm font-semibold">{value}/100</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Current Event */}
            <Card className="p-8 border-2 border-[#D4AF37]">
              <div className="mb-4 text-sm text-gray-500">
                Scenario {currentEvent + 1} of {EVENTS.length}
              </div>
              <h2 className="text-2xl mb-4">{EVENTS[currentEvent].title}</h2>
              <p className="text-gray-700 mb-8">{EVENTS[currentEvent].description}</p>
              
              <div className="space-y-3">
                {EVENTS[currentEvent].choices.map((choice, index) => (
                  <Button
                    key={index}
                    onClick={() => handleChoice(choice.effects)}
                    variant="outline"
                    className="w-full text-left h-auto py-4 px-6 border-2 border-black/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all"
                  >
                    {choice.text}
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        )}

        {gameComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="p-8 border-2 border-green-500 bg-green-50">
              <h2 className="text-3xl mb-4 text-center">Simulation Complete!</h2>
              <p className="text-center text-gray-700 mb-6">
                You've successfully navigated all 30 career scenarios. Here are your final attributes:
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(attributes).map(([key, value]) => {
                  const Icon = attributeIcons[key as keyof Attributes];
                  return (
                    <div key={key} className="bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-[#D4AF37]" />
                        <span className="font-semibold">{attributeLabels[key as keyof Attributes]}</span>
                      </div>
                      <div className="text-3xl text-[#D4AF37] mb-2">{value}</div>
                      <Progress value={value} className="h-2" />
                    </div>
                  );
                })}
              </div>

              {loadingFeedback ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Generating your personalized feedback...</p>
                </div>
              ) : feedback && (
                <div className="bg-white p-6 rounded-lg border-2 border-[#D4AF37] mb-6">
                  <h3 className="font-semibold mb-3 text-lg">AI Career Coach Feedback</h3>
                  <p className="text-gray-700 whitespace-pre-line">{feedback}</p>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetGame}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  Play Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/games'}
                  variant="outline"
                  className="border-2 border-black/20 hover:border-black/40"
                >
                  Back to Games
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}