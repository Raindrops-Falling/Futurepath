import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { LessonData } from '../data/lessonsData';
import { supabase } from '../lib/supabase';

interface LessonViewProps {
  lesson: LessonData;
  onClose: () => void;
}

export function LessonView({ lesson, onClose }: LessonViewProps) {
  const [currentSection, setCurrentSection] = useState<'content' | 'mcq' | 'openended'>('content');
  const [mcqAnswers, setMcqAnswers] = useState<(number | null)[]>(new Array(lesson.mcQuestions.length).fill(null));
  const [mcqSubmitted, setMcqSubmitted] = useState(false);
  const [openEndedAnswers, setOpenEndedAnswers] = useState<string[]>(new Array(lesson.openEndedQuestions.length).fill(''));
  const [openEndedSubmitted, setOpenEndedSubmitted] = useState<boolean[]>(new Array(lesson.openEndedQuestions.length).fill(false));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [aiFeedbacks, setAiFeedbacks] = useState<string[]>(new Array(lesson.openEndedQuestions.length).fill(''));
  const [loadingFeedback, setLoadingFeedback] = useState<boolean[]>(new Array(lesson.openEndedQuestions.length).fill(false));
  const [mcqAlreadyCompleted, setMcqAlreadyCompleted] = useState(false);
  const [oeAlreadyCompleted, setOeAlreadyCompleted] = useState(false);
  const [retryMode, setRetryMode] = useState(false);
  const [generatingNewQuestions, setGeneratingNewQuestions] = useState(false);
  const [aiGeneratedMCQs, setAiGeneratedMCQs] = useState<any[]>([]);
  const [aiGeneratedOEs, setAiGeneratedOEs] = useState<any[]>([]);

  const lessonId = `${lesson.courseId}-${lesson.moduleId}-${lesson.lessonId}`;

  useEffect(() => {
    checkAuthAndLoadProgress();
  }, []);

  const checkAuthAndLoadProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setIsAuthenticated(true);
        
        // Fetch user profile to check completion status
        const { projectId } = await import('../../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;
          
          // Check if MCQ is completed for this lesson
          if (profile.completedMC && profile.completedMC.includes(lessonId)) {
            setMcqAlreadyCompleted(true);
          }
          
          // Check if Open-Ended is completed for this lesson
          if (profile.completedOE && profile.completedOE.includes(lessonId)) {
            setOeAlreadyCompleted(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth/progress:', error);
    }
  };

  const handleMCQAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...mcqAnswers];
    newAnswers[questionIndex] = answerIndex;
    setMcqAnswers(newAnswers);
  };

  const handleRetryMCQ = () => {
    setMcqAnswers(new Array(lesson.mcQuestions.length).fill(null));
    setMcqSubmitted(false);
    setRetryMode(true);
  };

  const handleRetryOE = () => {
    setOpenEndedAnswers(new Array(lesson.openEndedQuestions.length).fill(''));
    setOpenEndedSubmitted(new Array(lesson.openEndedQuestions.length).fill(false));
    setAiFeedbacks(new Array(lesson.openEndedQuestions.length).fill(''));
    setRetryMode(true);
  };

  const generateNewMCQs = async () => {
    setGeneratingNewQuestions(true);
    
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
              "content": "You are a career education expert. Generate multiple choice questions based on lesson content. Return ONLY valid JSON in this exact format: [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0, \"explanation\": \"...\"}]"
            },
            {
              "role": "user",
              "content": `Based on this lesson content:\n\n${lesson.content}\n\nGenerate 5 new multiple choice questions that are different from these existing questions:\n${lesson.mcQuestions.map(q => q.question).join('\n')}\n\nReturn as valid JSON array.`
            }
          ],
          "provider": {
            "name": "deepinfra"
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        try {
          const questions = JSON.parse(content);
          setAiGeneratedMCQs(questions);
        } catch {
          alert('Failed to generate new questions. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error generating MCQs:', error);
      alert('Failed to generate new questions. Please try again.');
    } finally {
      setGeneratingNewQuestions(false);
    }
  };

  const generateNewOEs = async () => {
    setGeneratingNewQuestions(true);
    
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
              "content": "You are an experienced career coach and teacher. Review the student's answer to the question and provide constructive, encouraging feedback. Be specific about what they did well and where they can improve. Keep your feedback to 3-4 sentences."
            },
            {
              "role": "user",
              "content": `Based on this lesson content:\n\n${lesson.content}\n\nGenerate  new open-ended questions that are different from these existing questions:\n${lesson.openEndedQuestions.map(q => q.question).join('\n')}\n\nReturn as valid JSON array.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';
        try {
          const questions = JSON.parse(content);
          setAiGeneratedOEs(questions);
          setOpenEndedAnswers(new Array(lesson.openEndedQuestions.length).fill(''));
        } catch {
          alert('Failed to generate new questions. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error generating OEs:', error);
      alert('Failed to generate new questions. Please try again.');
    } finally {
      setGeneratingNewQuestions(false);
    }
  };

  const submitMCQ = async () => {
    setMcqSubmitted(true);
    
    // If user is authenticated and this is first completion, update backend
    if (isAuthenticated && !mcqAlreadyCompleted && !retryMode) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { projectId } = await import('../../utils/supabase/info');
          
          // Call backend to increment MC questions (adds 5 questions)
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/increment-question`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                question_type: 'multiple_choice',
                lesson_id: lessonId,
                course_id: lesson.courseId
              }),
            }
          );

          if (response.ok) {
            console.log('MCQ completion tracked successfully');
            // Add XP: 1 XP per MCQ question
            const xpResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/add-xp`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  xp_amount: lesson.mcQuestions.length * 1 // 1 XP per MCQ
                }),
              }
            );
            
            if (xpResponse.ok) {
              console.log('XP added for MCQ completion');
            }
          } else {
            console.error('Failed to track MCQ completion');
          }
        }
      } catch (error) {
        console.error('Error tracking MCQ completion:', error);
      }
    }
  };

  // Handle Open-Ended Question Submit
  const handleOpenEndedSubmit = async (qIndex: number) => {
    if (!openEndedAnswers[qIndex].trim()) {
      const newFeedbacks = [...aiFeedbacks];
      newFeedbacks[qIndex] = 'Please provide an answer before submitting.';
      setAiFeedbacks(newFeedbacks);
      return;
    }

    const newLoadingFeedback = [...loadingFeedback];
    newLoadingFeedback[qIndex] = true;
    setLoadingFeedback(newLoadingFeedback);
    const newFeedbacks = [...aiFeedbacks];
    newFeedbacks[qIndex] = '';
    setAiFeedbacks(newFeedbacks);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          "Authorization": `Bearer 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`,
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
              "content": "You are an experienced career coach and teacher. Review the student's answer to the question and provide constructive, encouraging feedback. Be specific about what they did well and where they can improve. Keep your feedback to 3-4 sentences."
            },
            {
              "role": "user",
              "content": `Question: ${lesson.openEndedQuestions[qIndex].question}\n\nStudent's Answer: ${openEndedAnswers[qIndex]}\n\nProvide brief constructive feedback on this response.`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newFeedbacks = [...aiFeedbacks];
        newFeedbacks[qIndex] = data.choices?.[0]?.message?.content || 'Unable to generate feedback.';
        setAiFeedbacks(newFeedbacks);
        
        // Mark as submitted
        const newSubmitted = [...openEndedSubmitted];
        newSubmitted[qIndex] = true;
        setOpenEndedSubmitted(newSubmitted);
      } else {
        const newFeedbacks = [...aiFeedbacks];
        newFeedbacks[qIndex] = 'Unable to generate feedback.';
        setAiFeedbacks(newFeedbacks);
      }
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      const newFeedbacks = [...aiFeedbacks];
      newFeedbacks[qIndex] = 'Error generating feedback. Please try again.';
      setAiFeedbacks(newFeedbacks);
    } finally {
      const newLoadingFeedback = [...loadingFeedback];
      newLoadingFeedback[qIndex] = false;
      setLoadingFeedback(newLoadingFeedback);
    }
    
    // If user is authenticated and this is first completion, update backend
    if (isAuthenticated && !oeAlreadyCompleted && !retryMode && aiGeneratedOEs.length === 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { projectId } = await import('../../utils/supabase/info');
          
          // Call backend to increment OE questions
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/increment-question`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                question_type: 'open_ended',
                lesson_id: lessonId,
                course_id: lesson.courseId
              }),
            }
          );

          if (response.ok) {
            console.log('Open-ended completion tracked successfully');
            // Add XP: 2 XP per OE question
            const xpResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/add-xp`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  xp_amount: lesson.openEndedQuestions.length * 2 // 2 XP per OE
                }),
              }
            );
            
            if (xpResponse.ok) {
              console.log('XP added for OE completion');
            }
          } else {
            console.error('Failed to track open-ended completion');
          }
        }
      } catch (error) {
        console.error('Error tracking open-ended completion:', error);
      }
    }
  };

  const calculateMCQScore = () => {
    let correct = 0;
    mcqAnswers.forEach((answer, index) => {
      if (answer === lesson.mcQuestions[index].correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / lesson.mcQuestions.length) * 100);
  };

  const renderContent = () => {
    const paragraphs = lesson.content.trim().split('\n\n');
    
    return (
      <div className="prose prose-lg max-w-none">
        {paragraphs.map((paragraph, index) => {
          // Handle headers - CENTER THEM
          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
            const text = paragraph.slice(2, -2);
            return <h2 key={index} className="text-2xl mt-8 mb-4 text-center">{text}</h2>;
          }
          
          // Handle italics and bold within paragraphs
          const parts = paragraph.split(/(\*\*.*?\*\*|\*.*?\*)/g);
          return (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                  return <em key={i}>{part.slice(1, -1)}</em>;
                }
                // Handle bullet points
                if (part.startsWith('- ')) {
                  return <li key={i} className="ml-6">{part.slice(2)}</li>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <Button 
          onClick={onClose}
          variant="ghost"
          className="mb-6 hover:text-[#D4AF37]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl mb-8">{lesson.title}</h1>

          {/* Section Tabs */}
          <div className="flex gap-4 mb-8 border-b border-black/10">
            <button
              onClick={() => setCurrentSection('content')}
              className={`pb-4 px-4 transition-all ${
                currentSection === 'content'
                  ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Lesson Content
            </button>
            <button
              onClick={() => setCurrentSection('mcq')}
              className={`pb-4 px-4 transition-all ${
                currentSection === 'mcq'
                  ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Multiple Choice ({lesson.mcQuestions.length})
            </button>
            <button
              onClick={() => setCurrentSection('openended')}
              className={`pb-4 px-4 transition-all ${
                currentSection === 'openended'
                  ? 'border-b-2 border-[#D4AF37] text-[#D4AF37]'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Open-Ended ({lesson.openEndedQuestions.length})
            </button>
          </div>

          {/* Content Section */}
          {currentSection === 'content' && (
            <Card className="p-8 border-2 border-black/10">
              {renderContent()}
              
              <div className="mt-12 flex justify-end">
                <Button 
                  onClick={() => setCurrentSection('mcq')}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  Continue to Questions →
                </Button>
              </div>
            </Card>
          )}

          {/* MCQ Section */}
          {currentSection === 'mcq' && (
            <div className="space-y-6">
              {/* Show completion status if already completed */}
              {mcqAlreadyCompleted && !retryMode && !mcqSubmitted && (
                <Card className="p-8 bg-black text-white border-2 border-[#D4AF37] relative overflow-hidden">
                  {/* Geometric Designs - Circles Only */}
                  <motion.div
                    className="absolute top-4 right-4 w-12 h-12 border-2 border-[#D4AF37] rounded-full"
                    animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute bottom-4 left-4 w-10 h-10 border-2 border-[#D4AF37] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute top-1/2 left-8 w-6 h-6 border-2 border-[#D4AF37] rounded-full"
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className="text-center relative z-10">
                    <h3 className="mb-4">You've already completed this section!</h3>
                    <p className="text-gray-300 mb-6">
                      You can retry the existing questions (no XP awarded).
                    </p>
                    <Button 
                      onClick={handleRetryMCQ}
                      className="bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                    >
                      Retry Questions
                    </Button>
                  </div>
                </Card>
              )}

              {/* AI Generated Questions */}
              {aiGeneratedMCQs.length > 0 && (
                <Card className="p-6 border-2 border-green-500 bg-green-50">
                  <h3 className="mb-2">New AI-Generated Questions</h3>
                  <p className="text-sm text-gray-600">These questions are for practice only and do not award XP.</p>
                </Card>
              )}

              {/* Regular MCQ Questions */}
              {lesson.mcQuestions.map((question, qIndex) => (
                <Card key={qIndex} className={`p-6 border-2 ${mcqAlreadyCompleted && !retryMode ? 'border-gray-300 bg-gray-50 opacity-60' : 'border-black/10'}`}>
                  <h3 className="mb-4">Question {qIndex + 1}</h3>
                  <p className="mb-4 text-gray-700">{question.question}</p>
                  
                  <div className="space-y-3">
                    {question.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => !mcqSubmitted && !mcqAlreadyCompleted && handleMCQAnswer(qIndex, oIndex)}
                        disabled={mcqSubmitted || (mcqAlreadyCompleted && !retryMode)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          (mcqAlreadyCompleted && !retryMode) 
                            ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                            : mcqAnswers[qIndex] === oIndex
                            ? mcqSubmitted
                              ? oIndex === question.correctAnswer
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : 'border-[#D4AF37] bg-[#D4AF37]/5'
                            : mcqSubmitted && oIndex === question.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : 'border-black/10 hover:border-black/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {mcqSubmitted && oIndex === question.correctAnswer && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                            {mcqSubmitted && mcqAnswers[qIndex] === oIndex && oIndex !== question.correctAnswer && (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {mcqSubmitted && (
                    <Card className="mt-4 p-4 bg-black text-white border-2 border-[#D4AF37] rounded-lg text-center">
                      <p className="text-sm"><strong className="text-[#D4AF37]">Explanation:</strong> <span className="text-gray-200">{question.explanation}</span></p>
                    </Card>
                  )}
                </Card>
              ))}
              
              {!mcqSubmitted ? (
                <Button 
                  onClick={submitMCQ}
                  disabled={mcqAnswers.includes(null)}
                  className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  Submit Answers
                </Button>
              ) : (
                <Card className="p-8 bg-black text-white border-2 border-[#D4AF37] text-center">
                  <h3 className="mb-4 text-2xl text-[#D4AF37]">Your Score: {calculateMCQScore()}%</h3>
                  <p className="text-gray-200 mb-6">
                    You got {mcqAnswers.filter((answer, i) => answer === lesson.mcQuestions[i].correctAnswer).length} out of {lesson.mcQuestions.length} correct.
                    {retryMode && <span className="block mt-2 text-sm italic">Retry mode - no XP awarded</span>}
                  </p>
                  <Button 
                    onClick={() => setCurrentSection('openended')}
                    className="bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                  >
                    Continue to Open-Ended Questions →
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Open-Ended Section */}
          {currentSection === 'openended' && (
            <div className="space-y-6">
              {/* Show completion status if already completed */}
              {oeAlreadyCompleted && !retryMode && !openEndedSubmitted.every(submitted => submitted) && aiGeneratedOEs.length === 0 && (
                <Card className="p-8 bg-black text-white border-2 border-[#D4AF37] relative overflow-hidden">
                  {/* Geometric Designs - Circles Only */}
                  <motion.div
                    className="absolute top-4 right-4 w-12 h-12 border-2 border-[#D4AF37] rounded-full"
                    animate={{ scale: [1, 1.2, 1], rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute bottom-4 left-4 w-10 h-10 border-2 border-[#D4AF37] rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute top-1/2 left-8 w-6 h-6 border-2 border-[#D4AF37] rounded-full"
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <div className="text-center relative z-10">
                    <h3 className="mb-4">You've already completed this section!</h3>
                    <p className="text-gray-300 mb-6">
                      You can retry the existing questions (no XP awarded).
                    </p>
                    <Button 
                      onClick={handleRetryOE}
                      className="bg-[#D4AF37] hover:bg-[#B8941F] text-black"
                    >
                      Retry Questions
                    </Button>
                  </div>
                </Card>
              )}

              {/* AI Generated Questions */}
              {aiGeneratedOEs.length > 0 && (
                <Card className="p-6 border-2 border-green-500 bg-green-50">
                  <h3 className="mb-2">New AI-Generated Questions</h3>
                  <p className="text-sm text-gray-600">These questions are for practice only and do not award XP.</p>
                </Card>
              )}

              {/* Render the appropriate questions */}
              {(aiGeneratedOEs.length > 0 ? aiGeneratedOEs : lesson.openEndedQuestions).map((question: any, qIndex: number) => {
                // Check if ANY question is currently being processed
                const isAnyQuestionLoading = loadingFeedback.some(loading => loading);
                // Check if this specific question is loading
                const isThisQuestionLoading = loadingFeedback[qIndex];
                
                return (
                  <Card 
                    key={qIndex} 
                    className={`p-6 border-2 ${
                      oeAlreadyCompleted && !retryMode 
                        ? 'border-gray-300 bg-gray-50 opacity-60' 
                        : 'border-black/10'
                    }`}
                  >
                    <h3 className="mb-4">Open-Ended Question {qIndex + 1}</h3>
                    <p className="mb-4 text-gray-700">{question.question}</p>
                    
                    <Textarea
                      value={openEndedAnswers[qIndex] || ''}
                      onChange={(e) => {
                        const newAnswers = [...openEndedAnswers];
                        newAnswers[qIndex] = e.target.value;
                        setOpenEndedAnswers(newAnswers);
                      }}
                      disabled={openEndedSubmitted[qIndex] || (oeAlreadyCompleted && !retryMode) || (isAnyQuestionLoading && !isThisQuestionLoading)}
                      placeholder="Write your response here..."
                      className={`min-h-[200px] border-black/20 focus:border-[#D4AF37] ${
                        (oeAlreadyCompleted && !retryMode) || (isAnyQuestionLoading && !isThisQuestionLoading)
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    />
                    
                    {!openEndedSubmitted[qIndex] && (
                      <Button
                        onClick={() => handleOpenEndedSubmit(qIndex)}
                        disabled={
                          openEndedAnswers[qIndex]?.trim().length < 50 || 
                          loadingFeedback[qIndex] || 
                          (oeAlreadyCompleted && !retryMode) ||
                          (isAnyQuestionLoading && !isThisQuestionLoading)
                        }
                        className="mt-4 bg-[#D4AF37] hover:bg-[#B8941F] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingFeedback[qIndex] ? 'Generating AI Feedback...' : 'Submit This Answer'}
                      </Button>
                    )}
                    
                    {openEndedSubmitted[qIndex] && aiFeedbacks[qIndex] && (
                      <Card className="mt-4 p-6 bg-black text-white border-2 border-[#D4AF37] relative overflow-hidden">
                        {/* Geometric Designs */}
                        <motion.div
                          className="absolute top-2 right-2 w-8 h-8 border-2 border-[#D4AF37]"
                          style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute bottom-2 left-2 w-6 h-6 border-2 border-[#D4AF37] rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        <p className="text-sm relative z-10">
                          <strong className="text-[#D4AF37]">AI Feedback:</strong>
                          <span className="text-gray-200 ml-2">{aiFeedbacks[qIndex]}</span>
                        </p>
                      </Card>
                    )}
                  </Card>
                );
              })}
              
              {openEndedSubmitted.every(submitted => submitted) && (
                <Card className="p-8 bg-black text-white border-2 border-[#D4AF37] text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                    <h3 className="text-[#D4AF37]">All Responses Submitted!</h3>
                  </div>
                  <p className="text-gray-200">
                    Your responses have been saved and AI feedback has been provided above.
                    {retryMode && <span className="block mt-2 text-sm italic">Retry mode - no XP awarded</span>}
                    {aiGeneratedOEs.length > 0 && <span className="block mt-2 text-sm italic">Practice mode - no XP awarded</span>}
                  </p>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}