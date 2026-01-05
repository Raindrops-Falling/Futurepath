import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { GeometricShapes } from '../components/GeometricShapes';
import { Footer } from '../components/Footer';

export function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <div className="absolute inset-0 z-0">
        <GeometricShapes />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24 text-center"
        >
          <h1 className="text-6xl mb-6">
            The <span className="text-[#D4AF37]">Future</span> of<br />Career Education
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            FuturePath was built on a simple belief: everyone deserves access to quality career education. 
            We combine structured learning with <span className="text-[#D4AF37]">AI technology</span> to help students and 
            early professionals build <span className="text-[#D4AF37]">real-world skills</span>.
          </p>
        </motion.div>

        {/* Why FuturePath Section - Black Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-24 max-w-4xl mx-auto"
        >
          <div className="bg-black text-white p-12 rounded-xl relative overflow-hidden">
            <GeometricShapes />
            <div className="relative z-10 text-center">
              <h2 className="text-4xl mb-6">
                Why <span className="text-[#D4AF37]">FuturePath</span>?
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Your career is a path, not a destination. We are here to help you navigate each step—from your first resume to your next promotion. 
                The future is not something that happens to you; it is something you build. That is the FuturePath philosophy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* What We Believe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-4xl mb-12 text-center">What We Believe</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2">Neuroscience-Backed Learning</h3>
              <p className="text-gray-600">
                Based on key neuroscience principles, students need greater forms of active recall to learn properly. Beyond multiple choice questions, our AI tools activate higher-order thinking that helps you succeed and remember forever.
              </p>
            </Card>

            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2">AI-Powered Learning</h3>
              <p className="text-gray-600">
                Get personalized feedback and recommendations powered by advanced AI technology.
              </p>
            </Card>

            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2">Built for Students</h3>
              <p className="text-gray-600">
                Designed specifically for students and early-career professionals entering the workforce.
              </p>
            </Card>

            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2">Global Accessibility</h3>
              <p className="text-gray-600">
                Quality career education accessible to anyone, anywhere, completely free.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* Mission, Vision, Approach - 3 Side-by-Side Black Boxes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mb-24"
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                label: 'MISSION',
                title: 'Democratize Career Education',
                description: 'To democratize career education and give every student the skills they need to succeed in the modern workforce.'
              },
              {
                label: 'VISION',
                title: 'Skills Over Access',
                description: 'A world where career success is determined by skills and effort, not access to expensive coaching or elite networks.'
              },
              {
                label: 'APPROACH',
                title: 'Structured Curriculum with AI',
                description: 'We combine structured curriculum with AI-powered personalization to create learning experiences that actually work.'
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-black text-white p-8 rounded-xl relative overflow-hidden"
              >
                {/* Geometric shapes visible in each black box */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
                  <motion.div
                    className="absolute top-5 right-5 w-12 h-12 border-2 border-[#D4AF37]"
                    style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 12 + index * 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </div>

                <div className="relative z-10 text-center">
                  <p className="text-xs tracking-widest text-[#D4AF37] mb-4">{item.label}</p>
                  <h3 className="text-2xl mb-4 text-white">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works - Numbered List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-24 relative z-20"
        >
          <h2 className="text-4xl mb-12 text-center">How It Works</h2>
          
          <div className="space-y-6">
            {[
              {
                number: '01',
                title: 'Real Progress Tracking',
                description: 'Your progress updates only when you complete actual work. No fake metrics, no assumptions—just honest tracking of your learning journey.'
              },
              {
                number: '02',
                title: 'AI-Evaluated Responses',
                description: 'Open-ended questions are evaluated by AI, giving you personalized feedback that helps you improve with each answer.'
              },
              {
                number: '03',
                title: 'Interactive Simulations',
                description: 'Our career simulation games let you practice real-world decisions in a safe environment, learning from outcomes without real-world consequences.'
              },
              {
                number: '04',
                title: 'Free Learning Resources',
                description: 'Our Skill Gap Analyzer recommends free resources for every skill you need to develop. Quality education shouldn\'t require expensive courses.'
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex gap-6 border-l-4 border-[#D4AF37] pl-6 py-4 hover:border-black transition-colors bg-white/80 backdrop-blur-sm rounded-r-lg"
              >
                <div className="text-5xl font-bold text-[#D4AF37]/40 leading-none">
                  {item.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Card className="p-12 bg-gradient-to-br from-black via-gray-900 to-black text-white border-2 border-[#D4AF37] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-4xl mb-4">Ready to Start Your Journey?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of learners advancing their careers with <span className="text-[#D4AF37] font-semibold">FuturePath</span>
              </p>
              <div className="flex gap-4 justify-center">
                <a href="/courses">
                  <button className="bg-[#D4AF37] hover:bg-[#B8941F] text-white px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105">
                    Explore Courses
                  </button>
                </a>
                <a href="/signup">
                  <button className="bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-lg font-semibold transition-all transform hover:scale-105">
                    Sign Up Free
                  </button>
                </a>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}