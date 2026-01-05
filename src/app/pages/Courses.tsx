import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { GeometricShapes } from '../components/GeometricShapes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { Footer } from '../components/Footer';
import { coursesData, lessons } from '../data/lessonsData';
import { useState, useEffect } from 'react';
import { LessonView } from '../components/LessonView';
import { BookOpen, CheckCircle2, Star, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Courses() {
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<{ completedMC: string[], completedOE: string[] } | null>(null);

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
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
          setUserProgress({
            completedMC: data.profile.completedMC || [],
            completedOE: data.profile.completedOE || []
          });
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const calculateLessonProgress = (courseId: number, moduleId: number, lessonId: number): number => {
    if (!userProgress) return 0;
    const lessonKey = `${courseId}-${moduleId}-${lessonId}`;
    const hasMC = userProgress.completedMC.includes(lessonKey);
    const hasOE = userProgress.completedOE.includes(lessonKey);
    
    if (hasMC && hasOE) return 100;
    if (hasMC || hasOE) return 50;
    return 0;
  };

  const calculateModuleProgress = (courseId: number, moduleId: number, lessonCount: number): number => {
    if (!userProgress) return 0;
    let totalProgress = 0;
    for (let i = 1; i <= lessonCount; i++) {
      totalProgress += calculateLessonProgress(courseId, moduleId, i);
    }
    return Math.round(totalProgress / lessonCount);
  };

  const calculateCourseProgress = (course: any): number => {
    if (!userProgress) return 0;
    let totalLessons = 0;
    let totalProgress = 0;
    
    course.modules.forEach((module: any) => {
      module.lessons.forEach((lesson: any) => {
        totalLessons++;
        totalProgress += calculateLessonProgress(course.id, module.id, lesson.id);
      });
    });
    
    return totalLessons > 0 ? Math.round(totalProgress / totalLessons) : 0;
  };

  const handleStartLesson = async (courseId: number, moduleId: number, lessonId: number) => {
    const lessonKey = `${courseId}-${moduleId}-${lessonId}`;
    if (lessons[lessonKey]) {
      setSelectedLesson(lessonKey);
      
      // Track course access
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { projectId } = await import('../../utils/supabase/info');
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/update-recent-courses`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                course_id: courseId.toString()
              }),
            }
          );
        }
      } catch (error) {
        console.error('Error tracking course access:', error);
      }
    } else {
      // Placeholder for lessons not yet implemented
      alert('This lesson content is coming soon!');
    }
  };

  if (selectedLesson && lessons[selectedLesson]) {
    return <LessonView lesson={lessons[selectedLesson]} onClose={() => setSelectedLesson(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl text-center mb-6"
        >
          Courses
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xl text-gray-600 mb-16 max-w-2xl mx-auto"
        >
          Structured learning paths to accelerate your career development
        </motion.p>

        {/* How Progress Works - Black Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <div className="bg-black text-white p-10 rounded-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="mb-6 text-3xl text-center">How Progress Works</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    title: 'Complete Lessons',
                    description: 'Read through lesson content and understand key concepts before proceeding to questions.'
                  },
                  {
                    title: 'Answer Questions',
                    description: 'Complete both multiple-choice and open-ended questions to demonstrate understanding.'
                  },
                  {
                    title: 'Earn XP',
                    description: 'Gain experience points for completing lessons and answering questions correctly.'
                  },
                  {
                    title: 'Track Progress',
                    description: 'Monitor your course completion and skill development in your profile.'
                  }
                ].map((item, index) => (
                  <div key={index} className="border-l-4 border-[#D4AF37] pl-6 py-2">
                    <h4 className="mb-2 text-lg font-semibold text-white">{item.title}</h4>
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8">
          {coursesData.map((course, courseIndex) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + courseIndex * 0.1, duration: 0.6 }}
            >
              <Card className="border-2 border-black/10 hover:border-[#D4AF37] transition-all overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h2>{course.title}</h2>
                      </div>
                      
                      {/* Course Progress Bar */}
                      {userProgress && course.modules.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Course Progress</span>
                            <span className="font-semibold text-[#D4AF37]">{calculateCourseProgress(course)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${calculateCourseProgress(course)}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-full rounded-full"
                            />
                          </div>
                        </div>
                      )}
                      
                      <p className="text-gray-600 leading-relaxed">{course.description}</p>
                    </div>
                    <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0 ml-6">
                      {String(course.id).padStart(2, '0')}
                    </div>
                  </div>

                  {course.modules.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {course.modules.map((module) => (
                        <AccordionItem key={module.id} value={`module-${module.id}`} className="border-black/10">
                          <AccordionTrigger className="hover:text-[#D4AF37] text-left">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[#D4AF37] font-semibold">Module {module.id}</span>
                                <span>{module.title}</span>
                              </div>
                              
                              {/* Module Progress Bar */}
                              {userProgress && (
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      style={{ width: `${calculateModuleProgress(course.id, module.id, module.lessons.length)}%` }}
                                      className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-full rounded-full transition-all duration-500"
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-[#D4AF37] min-w-[3rem]">
                                    {calculateModuleProgress(course.id, module.id, module.lessons.length)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2 pl-4">
                              {module.lessons.map((lesson) => {
                                const lessonKey = `${course.id}-${module.id}-${lesson.id}`;
                                const hasContent = !!lessons[lessonKey];
                                const lessonProgress = calculateLessonProgress(course.id, module.id, lesson.id);
                                
                                return (
                                  <div
                                    key={lesson.id}
                                    className="p-4 bg-white rounded-lg border-2 border-black/5 hover:border-[#D4AF37]/50 transition-all group"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold group-hover:bg-[#D4AF37]/10 group-hover:text-[#D4AF37] transition-colors">
                                          {lesson.id}
                                        </div>
                                        <span className="text-sm">{lesson.title}</span>
                                        {!hasContent && (
                                          <span className="text-xs text-gray-400 italic">(Coming soon)</span>
                                        )}
                                      </div>
                                      <Button 
                                        size="sm"
                                        onClick={() => handleStartLesson(course.id, module.id, lesson.id)}
                                        className="bg-[#D4AF37] hover:bg-[#B8941F] text-white transform group-hover:scale-105 transition-all"
                                        disabled={!hasContent}
                                      >
                                        Start
                                      </Button>
                                    </div>
                                    
                                    {/* Lesson Progress Bar */}
                                    {userProgress && hasContent && (
                                      <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            style={{ width: `${lessonProgress}%` }}
                                            className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] h-full rounded-full transition-all duration-500"
                                          />
                                        </div>
                                        <span className="text-xs font-semibold text-[#D4AF37] min-w-[3rem]">
                                          {lessonProgress}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                      <p className="text-gray-500">
                        Course content coming soon! This comprehensive course is currently being developed.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}