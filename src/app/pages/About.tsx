import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { GeometricShapes } from "../components/GeometricShapes";
import { Footer } from "../components/Footer";

export function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <div className="absolute inset-0 z-0">
        <GeometricShapes />
      </div>

      <div className="relative z-20 max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24 text-center relative z-30"
        >
          <h1 className="text-6xl mb-6">
            About Future<span className="text-[#D4AF37]">Path</span>{" "}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto"> Our rationale and <span className="text-[#D4AF37]">reasoning</span> that propels our commitment to improving career education.</p>
        </motion.div>

        

        {/* What We Believe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-24 relative z-30"
        >
          <h2 className="text-4xl mb-12 text-center">
            Statement of The <span className="text-[#D4AF37]">Problem </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2 text-center">
                Shortage of Personalization
              </h3>
              <p className="text-gray-600 text-center">
                Many online tools for career education aren't personalized, as direct, in-person resources often are costly and <span className="text-[#D4AF37]">lack convenience</span>.
              </p>
            </Card>

            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2 text-center">
                Limited Skill Development
              </h3>
              <p className="text-gray-600 text-center">
                Studies show students are often<span className="text-[#D4AF37]"> nervous </span>about their career skills and struggle to apply them.
              </p>
            </Card>

            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2 text-center">
                Low Engagement And Retention
              </h3>
              <p className="text-gray-600">
                Students, especially those of the younger generation, tend to not <span className="text-[#D4AF37]">enjoy</span> using career education tools.
              </p>
            </Card>

            <Card className="p-8 border-2 border-black/10 hover:border-[#D4AF37] transition-all">
              <h3 className="text-xl mb-2 text-center">
                Lack of Innovation
              </h3>
              <p className="text-gray-600 text-center">
                Career and Technical Education hasn't caught up to the <span className="text-[#D4AF37]">rapid developments</span> occuring in the current education space.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* How It Works - Numbered List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-24 relative z-30"
        >
          <h2 className="text-4xl mb-12 text-center">
            How Future<span className="text-[#D4AF37]">Path</span> Works
          </h2>

          <div className="space-y-6">
            {[
              {
                number: "01",
                title: "Neuroscience-Backed Learning",
                description:
                  "Beyond multiple choice questions, our AI tools activate open-ended thinking that helps you succeed and remember forever.",
              },
              {
                number: "02",
                title: "AI-Evaluated Responses",
                description:
                  "Get personalized feedback and recommendations powered by advanced AI technology.",
              },
              {
                number: "03",
                title: "Gamified Learning Environments",
                description:
                  "Designed specifically for students and early-career professionals entering the workforce while creating engaging experiences.",
              },
              {
                number: "04",
                title: "Deep, Varied Lessons",
                description:
                  "Quality career education that covers a wide variety of topics at great depth.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                }}
                className="flex gap-6 border-l-4 border-[#D4AF37] pl-6 py-4 hover:border-black transition-colors bg-white/80 backdrop-blur-sm rounded-r-lg"
              >
                <div className="text-5xl font-bold text-[#D4AF37]/40 leading-none">
                  {item.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
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
          className="relative z-30"
        >
          <Card className="p-12 bg-gradient-to-br from-black via-gray-900 to-black text-white border-2 border-[#D4AF37] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-full blur-3xl"></div>

            <div className="relative z-40 text-center">
              <h2 className="text-4xl mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of learners advancing their
                careers with{" "}
                <span className="text-[#D4AF37] font-semibold">
                  FuturePath
                </span>
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