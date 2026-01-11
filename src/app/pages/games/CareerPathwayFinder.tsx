import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { ArrowRight, CheckCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function CareerPathwayFinder() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [careerPath, setCareerPath] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dimensionScores, setDimensionScores] = useState<{ [key: string]: number }>({});
  const [results, setResults] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check auth state
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };
    checkAuth();
    
    // Track game click/start
    const trackGameStart = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { projectId } = await import('../../../utils/supabase/info');
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/start-game`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                game_id: 'career-pathway-finder'
              }),
            }
          );
        }
      } catch (error) {
        console.error('Error tracking game start:', error);
      }
    };
    
    trackGameStart();
  }, []);

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsGenerating(true);
      generateCareerPath(newAnswers);
    }
  };

  const generateCareerPath = async (finalAnswers: string[]) => {
    // Step 1: Calculate dimension scores
    const scores: { [key: string]: number } = {};
    
    QUESTIONS.forEach((question, qIndex) => {
      const answerIndex = finalAnswers[qIndex];
      if (answerIndex !== undefined) {
        const selectedOption = question.options[answerIndex];
        Object.entries(selectedOption.dimensions).forEach(([dim, points]) => {
          scores[dim] = (scores[dim] || 0) + points;
        });
      }
    });

    // Normalize scores to 0-100
    const maxScores: { [key: string]: number } = {};
    QUESTIONS.forEach(question => {
      question.options.forEach(option => {
        Object.entries(option.dimensions).forEach(([dim, points]) => {
          maxScores[dim] = Math.max(maxScores[dim] || 0, points);
        });
      });
    });

    const normalizedScores: { [key: string]: number } = {};
    Object.entries(scores).forEach(([dim, score]) => {
      // Count how many questions contributed to this dimension
      let questionCount = 0;
      QUESTIONS.forEach(question => {
        if (question.options.some(opt => dim in opt.dimensions)) {
          questionCount++;
        }
      });
      const maxPossible = maxScores[dim] * questionCount;
      normalizedScores[dim] = Math.round((score / maxPossible) * 100);
    });

    // Step 2: Calculate fit scores for each career
    const careerFits = CAREER_PROFILES.map(career => {
      let totalDifference = 0;
      let dimensionCount = 0;

      Object.entries(career.targetScores).forEach(([dim, target]) => {
        const userScore = normalizedScores[dim] || 0;
        const difference = Math.abs(target - userScore);
        totalDifference += difference;
        dimensionCount++;
      });

      const avgDifference = totalDifference / dimensionCount;
      const fitScore = Math.max(0, 100 - avgDifference);

      return {
        career,
        score: Math.round(fitScore),
        confidence: fitScore > 70 ? 'Strong Fit' : fitScore > 50 ? 'Moderate Fit' : 'Exploring'
      };
    });

    // Sort by score
    careerFits.sort((a, b) => b.score - a.score);
    setResults(careerFits);
    setIsComplete(true);

    // Award XP for game completion
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

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setDimensionScores({});
    setResults([]);
    setIsComplete(false);
  };

  const goBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
        <GeometricShapes />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl mb-4">Your Career Pathways</h1>
            <p className="text-xl text-gray-600">
              Based on your responses, here are your top career direction matches
            </p>
          </motion.div>

          <Card className="p-8 border-2 border-[#D4AF37] bg-[#D4AF37]/5 mb-8">
            <h2 className="text-2xl mb-4">What This Means</h2>
            <p className="text-gray-700 mb-4">
              This assessment highlights career directions that align with your current preferences, strengths, and learning style.
            </p>
            <p className="text-gray-700">
              <strong>Important:</strong> These results are not predictions or limitations — they help personalize your learning experience and can be retaken as you grow.
            </p>
          </Card>

          <div className="space-y-6">
            {results.slice(0, 3).map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 border-2 ${
                  index === 0 ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-black/10'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {index === 0 && <Target className="w-6 h-6 text-[#D4AF37]" />}
                      <div>
                        <h3 className="text-2xl">{result.career.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            result.confidence === 'Strong Fit' 
                              ? 'bg-green-100 text-green-700'
                              : result.confidence === 'Moderate Fit'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {result.confidence}
                          </span>
                          <span className="text-lg font-semibold text-[#D4AF37]">
                            {result.score}% Match
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{result.career.description}</p>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Key Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.career.keySkills.map((skill, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-white border border-black/20 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <h3 className="text-xl mb-4">Other Potential Paths</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {results.slice(3).map((result, index) => (
                <Card key={index} className="p-4 border border-black/10 text-center">
                  <p className="font-semibold mb-1">{result.career.name}</p>
                  <p className="text-sm text-gray-600">{result.score}% Match</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={resetAssessment}
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
            >
              Retake Assessment
            </Button>
            <Button
              onClick={() => window.location.href = '/courses'}
              variant="outline"
              className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5"
            >
              Explore Courses
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl mb-4">Career Pathway Finder</h1>
          <p className="text-xl text-gray-600">
            Discover career directions that align with your strengths and preferences
          </p>
        </motion.div>

        {/* Progress Bar */}
        <Card className="p-6 border-2 border-black/10 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div 
              className="bg-[#D4AF37] h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </Card>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-8 border-2 border-[#D4AF37]">
            <h2 className="text-2xl mb-8">{QUESTIONS[currentQuestion].text}</h2>
            
            <div className="space-y-4">
              {QUESTIONS[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className="w-full p-6 text-left rounded-lg border-2 border-black/10 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all"
                >
                  <span className="text-lg">{option.text}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            onClick={goBack}
            disabled={currentQuestion === 0}
            variant="outline"
            className="border-2 border-black/20 hover:border-black/40"
          >
            ← Previous
          </Button>
          <Button
            onClick={resetAssessment}
            variant="ghost"
            className="text-gray-600 hover:text-black"
          >
            Start Over
          </Button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

const QUESTIONS = [
  {
    text: "When solving a problem, I prefer to...",
    options: [
      { text: "Work with numbers and data", dimensions: { analytical: 3, technical: 2 } },
      { text: "Focus on how people are affected", dimensions: { people: 3, creative: 1 } },
      { text: "Find innovative solutions", dimensions: { creative: 3, analytical: 1 } },
      { text: "Follow proven methods", dimensions: { technical: 2, analytical: 1 } }
    ]
  },
  {
    text: "I feel most energized when...",
    options: [
      { text: "Working independently on complex tasks", dimensions: { technical: 2, analytical: 2 } },
      { text: "Collaborating with others", dimensions: { people: 3, creative: 1 } },
      { text: "Creating something new", dimensions: { creative: 3 } },
      { text: "Organizing and planning", dimensions: { analytical: 2, technical: 1 } }
    ]
  },
  {
    text: "In a team setting, I naturally...",
    options: [
      { text: "Take charge and lead", dimensions: { people: 2, analytical: 1 } },
      { text: "Support and encourage others", dimensions: { people: 3 } },
      { text: "Focus on the technical details", dimensions: { technical: 3 } },
      { text: "Generate new ideas", dimensions: { creative: 3 } }
    ]
  }
];

const CAREER_PROFILES = [
  {
    name: "Technical Specialist",
    description: "Focus on technical systems, coding, and problem-solving through technology.",
    keySkills: ["Programming", "System Design", "Debugging"],
    targetScores: { technical: 70, analytical: 60, creative: 40, people: 30 }
  },
  {
    name: "People Manager",
    description: "Lead teams, develop talent, and foster collaborative work environments.",
    keySkills: ["Leadership", "Communication", "Team Building"],
    targetScores: { people: 80, analytical: 50, creative: 40, technical: 30 }
  },
  {
    name: "Creative Professional",
    description: "Design innovative solutions and create compelling content or experiences.",
    keySkills: ["Design Thinking", "Innovation", "Storytelling"],
    targetScores: { creative: 80, people: 40, analytical: 40, technical: 30 }
  },
  {
    name: "Data Analyst",
    description: "Analyze complex datasets to drive strategic business decisions.",
    keySkills: ["Data Analysis", "Statistics", "Business Intelligence"],
    targetScores: { analytical: 80, technical: 60, creative: 30, people: 40 }
  },
  {
    name: "Project Coordinator",
    description: "Organize projects, manage timelines, and ensure successful delivery.",
    keySkills: ["Organization", "Planning", "Coordination"],
    targetScores: { analytical: 60, people: 60, technical: 40, creative: 40 }
  },
  {
    name: "Consultant",
    description: "Advise clients on strategic decisions and business improvements.",
    keySkills: ["Problem Solving", "Communication", "Strategy"],
    targetScores: { analytical: 70, people: 60, creative: 50, technical: 40 }
  }
];