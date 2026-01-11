import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { Upload, CheckCircle, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Feedback {
  category: string;
  score: number;
  issues: string[];
  suggestions: string[];
}

export function AIResumeChecker() {
  const [resumeText, setResumeText] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [overallScore, setOverallScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [deepResponseLoading, setDeepResponseLoading] = useState(false);
  const [deepResponse, setDeepResponse] = useState('');

  const getDeepResponse = async () => {
    setDeepResponseLoading(true);
    setDeepResponse('');
    
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
        setDeepResponse(aiResponse);
      } else {
        setDeepResponse('Unable to generate deep response. Please try again.');
      }
    } catch (error) {
      console.error('Error getting deep response:', error);
      setDeepResponse('Error generating deep response. Please try again.');
    } finally {
      setDeepResponseLoading(false);
    }
  };

  const analyzeResume = () => {
    // Simulate AI analysis
    const text = resumeText.toLowerCase();
    const wordCount = resumeText.split(/\s+/).length;
    
    const hasActionVerbs = /\b(managed|developed|created|implemented|designed|led|achieved|improved)\b/.test(text);
    const hasQuantifiableResults = /\d+%|\d+\+|\$\d+/.test(text);
    const hasKeywords = /\b(skills|experience|education|projects)\b/.test(text);
    const properLength = wordCount >= 200 && wordCount <= 600;
    
    const feedbackData: Feedback[] = [
      {
        category: 'Content Quality',
        score: hasActionVerbs && hasQuantifiableResults ? 85 : hasActionVerbs || hasQuantifiableResults ? 65 : 40,
        issues: [
          ...(!hasActionVerbs ? ['Missing strong action verbs'] : []),
          ...(!hasQuantifiableResults ? ['Lacks quantifiable achievements'] : [])
        ],
        suggestions: [
          'Start bullet points with action verbs (e.g., "Managed", "Developed", "Led")',
          'Include metrics and numbers to show impact (e.g., "Increased sales by 25%")',
          'Focus on achievements rather than just responsibilities'
        ]
      },
      {
        category: 'ATS Compatibility',
        score: hasKeywords ? 80 : 50,
        issues: [
          ...(!hasKeywords ? ['Missing standard section headers'] : []),
          ...(text.includes('table') ? ['May contain tables (not ATS-friendly)'] : [])
        ],
        suggestions: [
          'Use standard section headers: Skills, Experience, Education',
          'Avoid tables, text boxes, and graphics',
          'Include relevant keywords from job descriptions',
          'Use simple, clean formatting'
        ]
      },
      {
        category: 'Length & Structure',
        score: properLength ? 90 : 60,
        issues: [
          ...(wordCount < 200 ? ['Resume may be too short'] : []),
          ...(wordCount > 600 ? ['Resume may be too long'] : [])
        ],
        suggestions: [
          'Aim for 1 page for entry-level, 2 pages for experienced professionals',
          'Use bullet points instead of paragraphs',
          'Prioritize most relevant and recent experience',
          'Remove outdated or irrelevant information'
        ]
      },
      {
        category: 'Professional Presentation',
        score: text.includes('@') && text.includes('education') ? 75 : 55,
        issues: [
          ...(!text.includes('@') ? ['Missing contact information'] : []),
          ...(!text.includes('education') ? ['Education section not clearly defined'] : [])
        ],
        suggestions: [
          'Include professional email and phone number',
          'Add LinkedIn profile URL',
          'Ensure consistent formatting throughout',
          'Proofread for spelling and grammar errors'
        ]
      }
    ];

    const avgScore = Math.round(
      feedbackData.reduce((sum, item) => sum + item.score, 0) / feedbackData.length
    );

    setFeedback(feedbackData);
    setOverallScore(avgScore);
    setAnalyzed(true);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
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
                <FileText className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-2xl">Paste Your Resume</h2>
              </div>
              
              <textarea
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value);
                  setAnalyzed(false);
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
            {!analyzed ? (
              <Card className="p-12 border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Paste your resume and click "Analyze" to see results</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className={`p-6 border-2 ${overallScore >= 80 ? 'border-green-500' : overallScore >= 60 ? 'border-yellow-500' : 'border-red-500'}`}>
                  <div className="text-center">
                    <div className="text-6xl font-bold mb-2" style={{ color: overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#eab308' : '#ef4444' }}>
                      {overallScore}
                    </div>
                    <h3 className="text-2xl mb-2">Overall Score</h3>
                    <p className="text-gray-600">
                      {overallScore >= 80 ? 'Excellent Resume!' : overallScore >= 60 ? 'Good Start - Room for Improvement' : 'Needs Significant Work'}
                    </p>
                  </div>
                </Card>

                {/* Detailed Feedback */}
                <div className="space-y-4">
                  {feedback.map((item, index) => (
                    <Card key={index} className="p-6 border-2 border-black/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{item.category}</h3>
                        <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                          {item.score}%
                        </div>
                      </div>

                      {item.issues.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-semibold text-red-700">Issues Found:</span>
                          </div>
                          <ul className="space-y-1 ml-6">
                            {item.issues.map((issue, i) => (
                              <li key={i} className="text-sm text-red-600">• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-semibold text-green-700">Suggestions:</span>
                        </div>
                        <ul className="space-y-1 ml-6">
                          {item.suggestions.slice(0, 2).map((suggestion, i) => (
                            <li key={i} className="text-sm text-gray-600">• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Deep Response Button */}
                <Button
                  onClick={getDeepResponse}
                  disabled={deepResponseLoading}
                  className="w-full bg-black hover:bg-[#D4AF37] text-white"
                >
                  {deepResponseLoading ? 'Generating Deep Analysis...' : 'Get AI Deep Response'}
                </Button>

                {/* Deep Response Display */}
                {deepResponse && (
                  <Card className="p-6 border-2 border-[#D4AF37] bg-gradient-to-br from-white to-gray-50">
                    <h3 className="text-2xl mb-4 text-[#D4AF37]">AI Deep Analysis</h3>
                    <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-wrap">
                      {deepResponse}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}