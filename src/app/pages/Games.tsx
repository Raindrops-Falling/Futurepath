import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { GeometricShapes } from '../components/GeometricShapes';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';
import { Briefcase, Star } from 'lucide-react';

export function Games() {
  const highlightedGame = {
    title: 'Corporate Clicker',
    description: 'Build your corporate empire in this addictive idle clicker game! Click to earn money, purchase upgrades, and watch your business grow even while you\'re away.',
    link: '/games/corporate-clicker',
    features: ['Idle Income Generation', 'Multiple Upgrade Tiers', 'Progress Saves Automatically']
  };

  const interactiveGames = [
    {
      title: 'Salary Negotiator',
      description: 'Practice negotiation scenarios in a safe environment. Get real-time feedback on your approach and learn winning strategies.',
      link: '/games/salary-negotiator',
      iconPath: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31-1.24-6-5.51-6-10V8.3l6-3.38 6 3.38V10c0 4.49-2.69 8.76-6 10zm-2-8h4v6h-4v-6z'
    },
    {
      title: 'Interview Simulator',
      description: 'Experience realistic interview scenarios with AI-powered interviewers. Build confidence and improve your responses.',
      link: '/games/interview-simulator',
      iconPath: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12zm-3-5h-2v2h2v-2zm0-4h-2v2h2V7zM9 13h2v-2H9v2zm0-4h2V7H9v2z'
    },
    {
      title: 'Career Simulation Game',
      description: 'Navigate realistic career scenarios and make strategic decisions that impact your professional journey.',
      link: '/games/career-simulation',
      iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
    }
  ];

  const aiTools = [
    {
      title: 'AI Career Chatbot',
      description: 'Get personalized career guidance, resume advice, and job search strategies through an intelligent AI assistant.',
      link: '/games/ai-chatbot',
      iconPath: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12h-2v2h-2v-2H7V7h2v2h2V7h2v2h2v5zm-2-7h-4v2h4V7z'
    },
    {
      title: 'Skill Gap Analyzer',
      description: 'Discover which of your skills are most valuable in the current job market and identify gaps to fill.',
      link: '/games/skill-gap-analyzer',
      iconPath: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z'
    },
    {
      title: 'AI Resume Checker',
      description: 'Get instant AI-powered feedback on your resume. Optimize for ATS systems and recruiter preferences.',
      link: '/games/ai-resume-checker',
      iconPath: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'
    },
    {
      title: 'Career Pathway Finder',
      description: 'Navigate your career path with our AI-powered assessment tool that helps identify your strengths and ideal career directions.',
      link: '/games/career-pathway-finder',
      iconPath: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2zm0 3.99l4.74 11.38L12 15.5l-4.74 1.87L12 5.99z'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl text-center mb-6"
        >
          Games & Tools
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-xl text-gray-600 mb-16 max-w-2xl mx-auto"
        >
          Interactive tools and simulations to accelerate your career development
        </motion.p>

        {/* Highlighted Game Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-24"
        >
          {/* Category Black Box with Geometric Background */}
          <div className="bg-black text-white p-8 rounded-xl mb-12 relative overflow-hidden">
            <GeometricShapes />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl mb-3 text-[#D4AF37]">Featured Game</h2>
              <p className="text-gray-300">
                Engage in a fun and addictive idle clicker game to build and grow your corporate empire.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              key={0}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative z-20"
            >
              <Link to={highlightedGame.link}>
                <Card className="p-6 border-2 border-black/10 hover:border-[#D4AF37] transition-all hover:shadow-xl group h-full flex flex-col text-center bg-white relative z-20">
                  {/* Custom Icon */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-black group-hover:bg-[#D4AF37] transition-colors rounded-xl flex items-center justify-center">
                      <Briefcase className="w-10 h-10 text-[#D4AF37] group-hover:text-black transition-colors" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl mb-3 group-hover:text-[#D4AF37] transition-colors">{highlightedGame.title}</h3>
                  <p className="text-gray-600 mb-6 flex-1">{highlightedGame.description}</p>
                  <Button className="bg-[#D4AF37] hover:bg-[#B8941F] text-white w-full group-hover:scale-105 transition-all">
                    Play Now
                  </Button>
                </Card>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Interactive Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-24"
        >
          {/* Category Black Box with Geometric Background */}
          <div className="bg-black text-white p-8 rounded-xl mb-12 relative overflow-hidden">
            <GeometricShapes />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl mb-3 text-[#D4AF37]">Interactive Games</h2>
              <p className="text-gray-300">
                Practice real-world career scenarios in a safe, gamified environment. Build confidence and skills through hands-on simulations that mirror actual workplace situations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interactiveGames.map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                className="relative z-20"
              >
                <Link to={game.link}>
                  <Card className="p-6 border-2 border-black/10 hover:border-[#D4AF37] transition-all hover:shadow-xl group h-full flex flex-col text-center bg-white relative z-20">
                    {/* Custom Icon */}
                    <div className="mb-4 flex justify-center">
                      <div className="w-16 h-16 bg-black group-hover:bg-[#D4AF37] transition-colors rounded-xl flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-[#D4AF37] group-hover:text-black transition-colors"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d={game.iconPath} />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-xl mb-3 group-hover:text-[#D4AF37] transition-colors">{game.title}</h3>
                    <p className="text-gray-600 mb-6 flex-1">{game.description}</p>
                    <Button className="bg-[#D4AF37] hover:bg-[#B8941F] text-white w-full group-hover:scale-105 transition-all">
                      Play Now
                    </Button>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {/* Category Black Box with Geometric Background */}
          <div className="bg-black text-white p-8 rounded-xl mb-12 relative overflow-hidden">
            <GeometricShapes />
            <div className="relative z-10 text-center">
              <h2 className="text-3xl mb-3 text-[#D4AF37]">AI Tools</h2>
              <p className="text-gray-300">
                Leverage artificial intelligence to analyze your career profile, optimize your application materials, and receive personalized recommendations for your professional development.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiTools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                className="relative z-20"
              >
                <Link to={tool.link}>
                  <Card className="p-6 border-2 border-black/10 hover:border-[#D4AF37] transition-all hover:shadow-xl group h-full flex flex-col text-center bg-white relative z-20">
                    {/* Custom Icon */}
                    <div className="mb-4 flex justify-center">
                      <div className="w-16 h-16 bg-[#D4AF37] group-hover:bg-black transition-colors rounded-xl flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-black group-hover:text-[#D4AF37] transition-colors"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d={tool.iconPath} />
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-xl mb-3 group-hover:text-[#D4AF37] transition-colors">{tool.title}</h3>
                    <p className="text-gray-600 mb-6 flex-1">{tool.description}</p>
                    <Button className="bg-black hover:bg-[#D4AF37] text-white w-full group-hover:scale-105 transition-all">
                      Launch Tool
                    </Button>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}