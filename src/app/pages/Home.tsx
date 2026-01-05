import { motion } from 'motion/react';
import { CyclingTypewriter } from '../components/CyclingTypewriter';
import { GeometricShapes, ParticleEffect } from '../components/GeometricShapes';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Target, TrendingUp, BarChart3, Zap, Brain, Users } from 'lucide-react';

export function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const courseTitles = [
    'Resume Writing',
    'Job Applications',
    'Interviews',
    'Internships & Networking',
    'Promotions & Career Growth'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative">
      <GeometricShapes />
      <ParticleEffect />
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative pt-24 md:pt-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#D4AF37]/5 to-transparent pointer-events-none"></div>
          
          <motion.div {...fadeIn} className="relative z-10">
            <h1 className="text-7xl mb-8 tracking-tight">
              AI-powered learning for
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl mb-16 h-20 flex items-center justify-center"
          >
            <CyclingTypewriter 
              phrases={[
                'boosting your career',
                'furthering your opportunities',
                'advancing your future',
                'developing your skills'
              ]}
              typingSpeed={80}
              deletingSpeed={40}
              pauseDuration={2500}
              className="text-[#D4AF37] font-semibold"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl mb-12 text-gray-600 max-w-2xl mx-auto"
          >
            Build future-ready career skills through interactive lessons, AI-powered practice, and real-world simulations
          </motion.p>

          {/* Simple CTA Buttons without motion wrapper to preserve Link functionality */}
          <div className="flex gap-4 flex-wrap justify-center mt-8">
            <Link to="/courses">
              <Button className="bg-[#D4AF37] hover:bg-[#B8941F] text-white px-8 py-6 text-lg transition-all transform hover:scale-105">
                Explore Courses
              </Button>
            </Link>
            <Link to="/games">
              <Button className="bg-black hover:bg-[#D4AF37] text-white px-8 py-6 text-lg transition-all transform hover:scale-105">
                Try Games
              </Button>
            </Link>
            <Link to="/articles">
              <Button 
                variant="outline" 
                className="border-2 border-black hover:bg-black hover:text-white px-8 py-6 text-lg transition-all transform hover:scale-105">
                Read Articles
              </Button>
            </Link>
          </div>
        </section>

        {/* Why FuturePath Section */}
        <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl mb-4">
              Why FuturePath?
            </h2>
            <p className="text-2xl text-gray-600">
              Education that prepares you for the <span className="text-[#D4AF37]">real world</span>
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                number: '01',
                title: 'Neuroscience-Backed Learning',
                description: 'Based on key neuroscience principles, students need greater forms of active recall to learn properly. Beyond multiple choice questions, our AI tools activate higher-order thinking that helps you succeed and remember forever.',
              },
              {
                number: '02',
                title: 'Real-World Skill Practice',
                description: 'Engage with interactive simulations and hands-on exercises that mirror actual workplace scenarios, ensuring you develop practical, job-ready competencies.',
              },
              {
                number: '03',
                title: 'Skill Gap Analysis',
                description: 'Identify your strengths and areas for improvement with comprehensive assessments, then receive targeted recommendations to bridge gaps and accelerate your professional growth.',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all hover:shadow-2xl group relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-bl-full"></div>
                  <div className="relative">
                    <div className="text-7xl font-bold text-[#D4AF37]/20 mb-4 group-hover:text-[#D4AF37]/30 transition-colors">
                      {item.number}
                    </div>
                    <h3 className="mb-4 text-2xl">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Article Previews - Black Box Design */}
        <section className="py-32 px-6 bg-black text-white relative overflow-hidden">
          {/* Geometric shapes visible in black background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-60">
            <motion.div
              className="absolute top-20 left-[15%] w-24 h-24 border-2 border-[#D4AF37]"
              style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-20 right-[10%] w-28 h-28 border-2 border-[#D4AF37] rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 20, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16 relative z-10"
          >
            <h2 className="text-5xl mb-6">
              Insights for your <span className="text-[#D4AF37]">career growth</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Expert insights and career guidance to support your professional journey
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                title: 'Navigating Job Interviews in a Competitive Market',
                description: 'Master the art of interviewing with research, practice, and adaptability in today\'s high-stakes job market.',
                readTime: '6 min read'
              },
              {
                title: 'Networking for Career Advancement',
                description: 'Build meaningful professional connections that drive career mobility, mentorship, and opportunities.',
                readTime: '5 min read'
              },
              {
                title: 'Crafting Resumes That Open Doors',
                description: 'Create concise, compelling resumes that stand out to employers and pass ATS screening.',
                readTime: '7 min read'
              }
            ].map((article, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
              >
                <Link to="/articles">
                  <Card className="overflow-hidden bg-white/5 border-white/10 hover:border-[#D4AF37] transition-all hover:shadow-xl group cursor-pointer h-full backdrop-blur-sm">
                    <div className="p-6">
                      <p className="text-xs text-[#D4AF37] mb-3 tracking-wider">{article.readTime}</p>
                      <h4 className="mb-3 text-xl text-white group-hover:text-[#D4AF37] transition-colors">{article.title}</h4>
                      <p className="text-gray-400 mb-4 leading-relaxed">
                        {article.description}
                      </p>
                      <div className="flex items-center text-[#D4AF37]">
                        <span className="text-sm">Read More</span>
                        <span className="ml-1">→</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-12 relative z-10"
          >
            <Link to="/articles">
              <Button className="px-8 py-4 border-2 border-[#D4AF37] bg-transparent text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all">
                View All Articles
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Course Previews */}
        <section className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl mb-6">Featured Courses</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive learning paths designed to accelerate your career growth
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {courseTitles.map((title, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link to="/courses">
                  <div className="flex items-center gap-6 border-l-4 border-[#D4AF37] pl-6 py-6 hover:border-black transition-colors group cursor-pointer">
                    <div className="text-6xl font-bold text-[#D4AF37]/30 leading-none group-hover:text-[#D4AF37]/50 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl mb-2 group-hover:text-[#D4AF37] transition-colors">{title}</h3>
                      <p className="text-gray-600">Click to explore lessons and start building your career skills</p>
                    </div>
                    <div className="text-[#D4AF37] group-hover:text-black transition-colors">
                      <svg 
                        className="w-12 h-12" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M13 7l5 5m0 0l-5 5m5-5H6" 
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}