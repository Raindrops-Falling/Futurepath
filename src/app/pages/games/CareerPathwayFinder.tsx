import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { Target, TrendingUp } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    dimensions: {
      [key: string]: number;
    };
  }[];
}

interface CareerProfile {
  name: string;
  targetScores: {
    WO_Systems: number;
    WO_People: number;
    WO_Ideas: number;
    SP: number;
    DS_Data: number;
    DS_Collaborative: number;
    DS_Intuition: number;
    CI: number;
    RT: number;
    LS: number;
    PP: number;
  };
  description: string;
  keySkills: string[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "You feel most satisfied after a workday when you've:",
    options: [
      { text: "Helped others solve problems", dimensions: { WO_People: 3 } },
      { text: "Improved how something works", dimensions: { WO_Systems: 3 } },
      { text: "Created or designed something", dimensions: { WO_Ideas: 3 } }
    ]
  },
  {
    id: 2,
    text: "In group projects, you naturally focus on:",
    options: [
      { text: "Team dynamics and communication", dimensions: { WO_People: 3 } },
      { text: "Process and execution", dimensions: { WO_Systems: 3 } },
      { text: "Conceptual direction and ideas", dimensions: { WO_Ideas: 3 } }
    ]
  },
  {
    id: 3,
    text: "Which task sounds most appealing?",
    options: [
      { text: "Coaching someone through a challenge", dimensions: { WO_People: 3 } },
      { text: "Streamlining a messy workflow", dimensions: { WO_Systems: 3 } },
      { text: "Brainstorming new approaches", dimensions: { WO_Ideas: 3 } }
    ]
  },
  {
    id: 4,
    text: "When starting a task, you prefer:",
    options: [
      { text: "Clear rules and expectations", dimensions: { SP: 3 } },
      { text: "Some guidance, some flexibility", dimensions: { SP: 2 } },
      { text: "Freedom to define your own approach", dimensions: { SP: 1 } }
    ]
  },
  {
    id: 5,
    text: "You work best when:",
    options: [
      { text: "Objectives are clearly defined", dimensions: { SP: 3 } },
      { text: "Goals exist but methods vary", dimensions: { SP: 2 } },
      { text: "The goal itself is open-ended", dimensions: { SP: 1 } }
    ]
  },
  {
    id: 6,
    text: "Ambiguous instructions make you feel:",
    options: [
      { text: "Uncomfortable", dimensions: { SP: 3 } },
      { text: "Neutral", dimensions: { SP: 2 } },
      { text: "Energized", dimensions: { SP: 1 } }
    ]
  },
  {
    id: 7,
    text: "You trust decisions most when they are:",
    options: [
      { text: "Backed by data", dimensions: { DS_Data: 3 } },
      { text: "Discussed with others", dimensions: { DS_Collaborative: 3 } },
      { text: "Guided by intuition", dimensions: { DS_Intuition: 3 } }
    ]
  },
  {
    id: 8,
    text: "When choosing between options, you usually:",
    options: [
      { text: "Compare measurable outcomes", dimensions: { DS_Data: 3 } },
      { text: "Consider people's input", dimensions: { DS_Collaborative: 3 } },
      { text: "Go with what feels right", dimensions: { DS_Intuition: 3 } }
    ]
  },
  {
    id: 9,
    text: "If a decision must be made quickly, you:",
    options: [
      { text: "Look for key facts", dimensions: { DS_Data: 3 } },
      { text: "Ask others' opinions", dimensions: { DS_Collaborative: 3 } },
      { text: "Rely on instinct", dimensions: { DS_Intuition: 3 } }
    ]
  },
  {
    id: 10,
    text: "Your ideal role involves:",
    options: [
      { text: "Minimal communication", dimensions: { CI: 1 } },
      { text: "Regular collaboration", dimensions: { CI: 2 } },
      { text: "Frequent presenting or persuading", dimensions: { CI: 3 } }
    ]
  },
  {
    id: 11,
    text: "You feel most confident when:",
    options: [
      { text: "Working independently", dimensions: { CI: 1 } },
      { text: "Working with a small team", dimensions: { CI: 2 } },
      { text: "Leading discussions", dimensions: { CI: 3 } }
    ]
  },
  {
    id: 12,
    text: "Feedback is best delivered when it's:",
    options: [
      { text: "Written and specific", dimensions: { CI: 1 } },
      { text: "Discussed interactively", dimensions: { CI: 2 } },
      { text: "Open and conversational", dimensions: { CI: 3 } }
    ]
  },
  {
    id: 13,
    text: "You value:",
    options: [
      { text: "Stability and predictability", dimensions: { RT: 1 } },
      { text: "Balance between safety and growth", dimensions: { RT: 2 } },
      { text: "Opportunity even if uncertain", dimensions: { RT: 3 } }
    ]
  },
  {
    id: 14,
    text: "A career path with unclear outcomes sounds:",
    options: [
      { text: "Stressful", dimensions: { RT: 1 } },
      { text: "Acceptable", dimensions: { RT: 2 } },
      { text: "Exciting", dimensions: { RT: 3 } }
    ]
  },
  {
    id: 15,
    text: "You're more motivated by:",
    options: [
      { text: "Security", dimensions: { RT: 1 } },
      { text: "Progression", dimensions: { RT: 2 } },
      { text: "Possibility", dimensions: { RT: 3 } }
    ]
  },
  {
    id: 16,
    text: "You improve fastest when feedback is:",
    options: [
      { text: "Structured and measurable", dimensions: { LS: 1 } },
      { text: "Ongoing and conversational", dimensions: { LS: 2 } },
      { text: "Open-ended and exploratory", dimensions: { LS: 3 } }
    ]
  },
  {
    id: 17,
    text: "When learning a new skill, you prefer:",
    options: [
      { text: "Step-by-step instruction", dimensions: { LS: 1 } },
      { text: "Practice with guidance", dimensions: { LS: 2 } },
      { text: "Experimentation", dimensions: { LS: 3 } }
    ]
  },
  {
    id: 18,
    text: "Mistakes are best viewed as:",
    options: [
      { text: "Something to minimize", dimensions: { LS: 1 } },
      { text: "Part of learning", dimensions: { LS: 2 } },
      { text: "A discovery tool", dimensions: { LS: 3 } }
    ]
  },
  {
    id: 19,
    text: "You perform best in environments that are:",
    options: [
      { text: "Predictable", dimensions: { PP: 1 } },
      { text: "Moderately dynamic", dimensions: { PP: 2 } },
      { text: "Fast-paced", dimensions: { PP: 3 } }
    ]
  },
  {
    id: 20,
    text: "Deadlines make you:",
    options: [
      { text: "Anxious", dimensions: { PP: 1 } },
      { text: "Focused", dimensions: { PP: 2 } },
      { text: "Energized", dimensions: { PP: 3 } }
    ]
  },
  {
    id: 21,
    text: "Your ideal workload feels:",
    options: [
      { text: "Steady", dimensions: { PP: 1 } },
      { text: "Variable", dimensions: { PP: 2 } },
      { text: "Intense", dimensions: { PP: 3 } }
    ]
  },
  {
    id: 22,
    text: "You'd rather:",
    options: [
      { text: "Improve an existing system", dimensions: { WO_Systems: 2 } },
      { text: "Manage people and goals", dimensions: { WO_People: 2 } },
      { text: "Build something new", dimensions: { WO_Ideas: 2 } }
    ]
  },
  {
    id: 23,
    text: "You measure success by:",
    options: [
      { text: "Consistency", dimensions: { SP: 2, PP: 1 } },
      { text: "Impact", dimensions: { WO_People: 2, CI: 2 } },
      { text: "Innovation", dimensions: { WO_Ideas: 2, RT: 2 } }
    ]
  },
  {
    id: 24,
    text: "You are most motivated by:",
    options: [
      { text: "Mastery", dimensions: { WO_Systems: 2, LS: 1 } },
      { text: "Leadership", dimensions: { WO_People: 2, CI: 2 } },
      { text: "Creativity", dimensions: { WO_Ideas: 2, RT: 2 } }
    ]
  }
];

const CAREER_PROFILES: CareerProfile[] = [
  {
    name: "Corporate / Operations",
    targetScores: {
      WO_Systems: 80,
      WO_People: 40,
      WO_Ideas: 40,
      SP: 80,
      DS_Data: 80,
      DS_Collaborative: 50,
      DS_Intuition: 30,
      CI: 50,
      RT: 30,
      LS: 30,
      PP: 40
    },
    description: "Excel in structured environments optimizing processes and systems. Strong analytical mindset with focus on efficiency and consistency.",
    keySkills: ["Process optimization", "Data analysis", "Project management", "Quality control"]
  },
  {
    name: "Business & Management",
    targetScores: {
      WO_Systems: 60,
      WO_People: 70,
      WO_Ideas: 50,
      SP: 60,
      DS_Data: 50,
      DS_Collaborative: 80,
      DS_Intuition: 50,
      CI: 80,
      RT: 60,
      LS: 60,
      PP: 70
    },
    description: "Lead teams and drive business objectives. Balance people management with strategic thinking and data-driven decision making.",
    keySkills: ["Team leadership", "Strategic planning", "Communication", "Performance management"]
  },
  {
    name: "Technology & Systems",
    targetScores: {
      WO_Systems: 90,
      WO_People: 30,
      WO_Ideas: 60,
      SP: 60,
      DS_Data: 80,
      DS_Collaborative: 40,
      DS_Intuition: 40,
      CI: 40,
      RT: 60,
      LS: 80,
      PP: 60
    },
    description: "Build and maintain technical systems. Strong problem-solving abilities with focus on innovation and continuous learning.",
    keySkills: ["Technical skills", "Problem solving", "System design", "Continuous learning"]
  },
  {
    name: "Creative & Media",
    targetScores: {
      WO_Systems: 30,
      WO_People: 50,
      WO_Ideas: 90,
      SP: 30,
      DS_Data: 30,
      DS_Collaborative: 50,
      DS_Intuition: 80,
      CI: 60,
      RT: 70,
      LS: 80,
      PP: 60
    },
    description: "Generate original content and creative solutions. Thrive in flexible environments that value innovation and artistic expression.",
    keySkills: ["Creative thinking", "Content creation", "Design", "Storytelling"]
  },
  {
    name: "Healthcare & Service",
    targetScores: {
      WO_Systems: 40,
      WO_People: 90,
      WO_Ideas: 40,
      SP: 70,
      DS_Data: 50,
      DS_Collaborative: 80,
      DS_Intuition: 50,
      CI: 60,
      RT: 30,
      LS: 60,
      PP: 80
    },
    description: "Help others and make direct positive impact. Combine empathy with structured procedures in high-stakes environments.",
    keySkills: ["Empathy", "Patient care", "Communication", "Stress management"]
  },
  {
    name: "Entrepreneurship / Startups",
    targetScores: {
      WO_Systems: 60,
      WO_People: 60,
      WO_Ideas: 80,
      SP: 30,
      DS_Data: 60,
      DS_Collaborative: 60,
      DS_Intuition: 70,
      CI: 80,
      RT: 90,
      LS: 80,
      PP: 90
    },
    description: "Build new ventures and drive innovation. Comfortable with uncertainty and rapid change while balancing multiple priorities.",
    keySkills: ["Vision", "Risk taking", "Adaptability", "Resourcefulness"]
  },
  {
    name: "Research & Analysis",
    targetScores: {
      WO_Systems: 80,
      WO_People: 30,
      WO_Ideas: 60,
      SP: 70,
      DS_Data: 90,
      DS_Collaborative: 40,
      DS_Intuition: 30,
      CI: 30,
      RT: 50,
      LS: 70,
      PP: 40
    },
    description: "Investigate complex problems and generate insights. Deep analytical skills with methodical approach to knowledge generation.",
    keySkills: ["Research methods", "Data analysis", "Critical thinking", "Writing"]
  },
  {
    name: "Education & Training",
    targetScores: {
      WO_Systems: 40,
      WO_People: 80,
      WO_Ideas: 70,
      SP: 60,
      DS_Data: 40,
      DS_Collaborative: 80,
      DS_Intuition: 50,
      CI: 80,
      RT: 40,
      LS: 70,
      PP: 60
    },
    description: "Share knowledge and develop others' potential. Combine subject expertise with strong interpersonal skills and patience.",
    keySkills: ["Teaching", "Curriculum design", "Communication", "Mentorship"]
  }
];

export function CareerPathwayFinder() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [dimensionScores, setDimensionScores] = useState<{ [key: string]: number }>({});
  const [results, setResults] = useState<{ career: CareerProfile; score: number; confidence: string }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = { ...answers, [currentQuestion]: optionIndex };
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = async (finalAnswers: { [key: number]: number }) => {
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

    setDimensionScores(normalizedScores);

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
    setAnswers({});
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
