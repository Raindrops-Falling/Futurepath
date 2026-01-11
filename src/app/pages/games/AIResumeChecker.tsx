import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { CheckCircle, XCircle, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function AIResumeChecker() {
  const [resumeText, setResumeText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
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
                game_id: 'ai-resume-checker'
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

  const analyzeResume = async () => {
    setIsAnalyzing(true);
    setFeedback(null);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          "Authorization": "Bearer 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",
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
              "content": "You are an expert resume reviewer and career coach. Provide detailed, personalized feedback on resumes. Be constructive, specific, and actionable. Structure your response in clear sections covering: overall impression, strengths, areas for improvement, and specific recommendations."
            },
            {
              "role": "user",
              "content": `Please provide a comprehensive analysis of this resume:\n\n${resumeText}\n\nProvide detailed feedback on:\n1. Overall impression and marketability\n2. Key strengths\n3. Critical areas for improvement\n4. Specific actionable recommendations\n5. Industry-specific considerations (if applicable)`
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || 'Unable to generate deep response.';
        setFeedback(aiResponse);
      } else {
        setFeedback('Unable to generate deep response. Please try again.');
      }
    } catch (error) {
      console.error('Error getting deep response:', error);
      setFeedback('Error generating deep response. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link to="/games">
            <Button variant="outline" className="mb-4 border-black/20 hover:border-[#D4AF37]">
              ← Back to Games
            </Button>
          </Link>
          
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl mb-4"
          >
            AI Resume Checker
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            Get instant AI-powered feedback on your resume
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border-2 border-black/10 h-full">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-2xl">Paste Your Resume</h2>
              </div>
              
              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                }}
                placeholder="Copy and paste your resume text here... Include all sections: contact info, summary, experience, education, skills, etc."
                className="w-full h-[400px] p-4 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#D4AF37] mb-4"
              />
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {resumeText.split(/\s+/).filter(w => w.length > 0).length} words
                </span>
                <span className="text-sm text-gray-500">
                  Recommended: 200-600 words
                </span>
              </div>
              
              <Button
                onClick={analyzeResume}
                disabled={resumeText.trim().length < 50}
                className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-white"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Resume
              </Button>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {!feedback ? (
              <Card className="p-12 border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Upload className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Paste your resume and click "Analyze" to see results</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Detailed Feedback */}
                <Card className="p-6 border-2 border-[#D4AF37] bg-gradient-to-br from-white to-gray-50">
                  <h3 className="text-2xl mb-4 text-[#D4AF37]">AI Deep Analysis</h3>
                  <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
                    {feedback}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}