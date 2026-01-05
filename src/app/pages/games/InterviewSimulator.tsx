import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { MessageSquare, CheckCircle2 } from 'lucide-react';

const INTERVIEW_TYPES = [
  { id: 'behavioral', name: 'Behavioral Interview', description: 'Answer questions about past experiences and behaviors' },
  { id: 'technical', name: 'Technical Interview', description: 'Demonstrate your technical knowledge and problem-solving skills' },
  { id: 'case', name: 'Case Interview', description: 'Solve business problems and demonstrate analytical thinking' },
];

const INTERVIEW_QUESTIONS: { [key: string]: string[] } = {
  behavioral: [
    "Tell me about a time when you had to deal with a difficult coworker. How did you handle it?",
    "Describe a situation where you had to meet a tight deadline. What was your approach?",
    "Give me an example of a time when you showed leadership skills.",
    "Tell me about a project that didn't go as planned. What did you learn?",
    "Describe a time when you had to learn something completely new for a project.",
  ],
  technical: [
    "Explain how you would approach debugging a complex system that's experiencing intermittent failures.",
    "What's your process for staying current with new technologies and industry trends?",
    "How would you explain a technical concept to a non-technical stakeholder?",
    "Describe your experience with version control and collaboration tools.",
    "Walk me through how you would optimize the performance of a slow-running application.",
  ],
  case: [
    "A retail company's sales have dropped 20% in the last quarter. How would you investigate and address this?",
    "How would you estimate the market size for electric vehicles in a major metropolitan area?",
    "A startup wants to enter a competitive market. What factors would you consider in their go-to-market strategy?",
    "How would you prioritize features for a new product with limited development resources?",
    "A company is considering expanding internationally. What framework would you use to evaluate this decision?",
  ],
};

export function InterviewSimulator() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState<string[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chatbotInteractions, setChatbotInteractions] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const startInterview = (type: string) => {
    setSelectedType(type);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentAnswer('');
    setFeedback([]);
    setInterviewComplete(false);
    setOverallFeedback('');
    setChatbotInteractions(0);
  };

  const submitAnswer = async () => {
    if (currentAnswer.trim().length < 50) {
      alert('Please provide a more detailed answer (at least 50 characters).');
      return;
    }

    setLoadingFeedback(true);
    const newAnswers = [...answers, currentAnswer];
    setAnswers(newAnswers);

    // Get AI feedback
    try {
      const questions = INTERVIEW_QUESTIONS[selectedType!];
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
              "content": "You are an experienced career coach and interviewer. Provide constructive feedback on the candidate's answer. Be specific about strengths and areas for improvement. Keep to 3-4 sentences."
            },
            {
              "role": "user",
              "content": `Question: ${questions[currentQuestion]}\n\nCandidate's Answer: ${currentAnswer}\n\nProvide brief constructive feedback on this interview response.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const feedbackText = data.choices?.[0]?.message?.content || 'Good response!';
        setFeedback([...feedback, feedbackText]);
        
        // Track chatbot interaction for XP (3 XP per interaction)
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
      } else {
        setFeedback([...feedback, 'Unable to generate feedback at this time.']);
      }
    } catch (error) {
      console.error('Error getting feedback:', error);
      setFeedback([...feedback, 'Error generating feedback.']);
    } finally {
      setLoadingFeedback(false);
    }

    // Move to next question or complete
    if (currentQuestion < INTERVIEW_QUESTIONS[selectedType!].length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer('');
    } else {
      await completeInterview(newAnswers);
    }
  };

  const completeInterview = async (finalAnswers: string[]) => {
    setInterviewComplete(true);
    setLoadingFeedback(true);

    // Generate overall feedback
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
          "model": "meta-llama/llama-3.2-8b-instruct",
          "messages": [
            {
              "role": "system",
              "content": "You are an experienced career coach. Provide overall feedback on interview performance with specific actionable advice. Keep to 4-5 sentences."
            },
            {
              "role": "user",
              "content": `A candidate completed a ${selectedType} interview with ${finalAnswers.length} questions. Provide overall performance feedback and tips for improvement.`
            }
          ],
          "provider": {
            "name": "deepinfra"
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOverallFeedback(data.choices?.[0]?.message?.content || 'Great job completing the interview!');
      } else {
        setOverallFeedback('Great job completing the interview! Review the feedback on each question to improve.');
      }
    } catch (error) {
      console.error('Error getting overall feedback:', error);
      setOverallFeedback('Great job completing the interview! Review the feedback on each question to improve.');
    } finally {
      setLoadingFeedback(false);
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
    setSelectedType(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setCurrentAnswer('');
    setFeedback([]);
    setInterviewComplete(false);
    setOverallFeedback('');
    setChatbotInteractions(0);
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
          <h1 className="text-5xl mb-4">Interview Simulator</h1>
          <p className="text-xl text-gray-600">
            Practice your interview skills with AI-powered feedback
          </p>
        </motion.div>

        {!selectedType && !interviewComplete && (
          <div className="space-y-6">
            <Card className="p-8 border-2 border-black/10">
              <h2 className="text-2xl mb-4">Choose Your Interview Type</h2>
              <p className="text-gray-700 mb-6">
                Select the type of interview you'd like to practice. You'll answer 5 questions and receive AI-powered feedback after each response.
              </p>
            </Card>

            {INTERVIEW_TYPES.map((type) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card 
                  className="p-6 border-2 border-black/10 hover:border-[#D4AF37] transition-all cursor-pointer"
                  onClick={() => startInterview(type.id)}
                >
                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-8 h-8 text-[#D4AF37] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl mb-2">{type.name}</h3>
                      <p className="text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {selectedType && !interviewComplete && (
          <div className="space-y-6">
            <Card className="p-6 border-2 border-black/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg">
                  Question {currentQuestion + 1} of {INTERVIEW_QUESTIONS[selectedType].length}
                </h3>
                <span className="text-sm text-gray-500">
                  {INTERVIEW_TYPES.find(t => t.id === selectedType)?.name}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-[#D4AF37] h-2 rounded-full transition-all"
                  style={{ width: `${((currentQuestion + 1) / INTERVIEW_QUESTIONS[selectedType].length) * 100}%` }}
                />
              </div>
            </Card>

            <Card className="p-8 border-2 border-[#D4AF37]">
              <h2 className="text-2xl mb-6">{INTERVIEW_QUESTIONS[selectedType][currentQuestion]}</h2>
              
              <Textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here... Be specific and provide examples."
                className="min-h-[250px] mb-4 border-black/20 focus:border-[#D4AF37]"
                disabled={loadingFeedback}
              />

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {currentAnswer.length} characters (minimum 50)
                </p>
                <Button
                  onClick={submitAnswer}
                  disabled={currentAnswer.trim().length < 50 || loadingFeedback}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  {loadingFeedback ? 'Getting Feedback...' : 'Submit Answer'}
                </Button>
              </div>
            </Card>

            {/* Show previous questions and feedback */}
            {feedback.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl">Previous Responses</h3>
                {feedback.map((fb, index) => (
                  <Card key={index} className="p-6 border-2 border-green-500 bg-green-50">
                    <h4 className="font-semibold mb-2">Question {index + 1}</h4>
                    <p className="text-sm text-gray-700 mb-3">{INTERVIEW_QUESTIONS[selectedType][index]}</p>
                    <div className="bg-white p-4 rounded-lg mb-3">
                      <p className="text-sm italic text-gray-600">{answers[index]}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <p className="text-sm"><strong>Feedback:</strong> {fb}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {interviewComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <Card className="p-8 border-2 border-green-500 bg-green-50">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h2 className="text-3xl">Interview Complete!</h2>
              </div>

              {loadingFeedback ? (
                <p className="text-gray-600">Generating your overall feedback...</p>
              ) : (
                <div className="bg-white p-6 rounded-lg border-2 border-[#D4AF37] mb-6">
                  <h3 className="font-semibold mb-3 text-lg">Overall Performance Feedback</h3>
                  <p className="text-gray-700 whitespace-pre-line">{overallFeedback}</p>
                </div>
              )}

              <div className="bg-white p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">
                  <strong>XP Earned:</strong> {chatbotInteractions * 3} XP from feedback + 15 XP completion bonus = {chatbotInteractions * 3 + 15} XP total
                </p>
              </div>
            </Card>

            {/* Show all questions and feedback */}
            <h3 className="text-2xl">Your Responses</h3>
            {feedback.map((fb, index) => (
              <Card key={index} className="p-6 border-2 border-black/10">
                <h4 className="font-semibold mb-2">Question {index + 1}</h4>
                <p className="text-gray-700 mb-3">{INTERVIEW_QUESTIONS[selectedType!][index]}</p>
                <div className="bg-gray-50 p-4 rounded-lg mb-3">
                  <p className="text-sm italic text-gray-700">{answers[index]}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <p className="text-sm"><strong>Feedback:</strong> {fb}</p>
                </div>
              </Card>
            ))}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetGame}
                className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
              >
                Practice Another Interview
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