import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { GeometricShapes } from '../../components/GeometricShapes';
import { Footer } from '../../components/Footer';
import { CheckCircle, XCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Skill {
  name: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
}

export function SkillGapAnalyzer() {
  const [selectedRole, setSelectedRole] = useState('');
  const [currentSkillsText, setCurrentSkillsText] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const roles = [
    'Software Developer',
    'Data Analyst',
    'Product Manager',
    'Marketing Manager',
    'Sales Representative',
    'HR Specialist',
    'Financial Analyst',
    'UX Designer'
  ];

  const allSkills: Record<string, Skill[]> = {
    'Software Developer': [
      { name: 'JavaScript/TypeScript', category: 'Programming', importance: 'high' },
      { name: 'React/Vue/Angular', category: 'Frameworks', importance: 'high' },
      { name: 'Git Version Control', category: 'Tools', importance: 'high' },
      { name: 'RESTful APIs', category: 'Technical', importance: 'high' },
      { name: 'Database Management', category: 'Technical', importance: 'medium' },
      { name: 'Testing/Debugging', category: 'Technical', importance: 'medium' },
      { name: 'Agile/Scrum', category: 'Methodology', importance: 'medium' },
      { name: 'Cloud Platforms (AWS/Azure)', category: 'Infrastructure', importance: 'low' }
    ],
    'Data Analyst': [
      { name: 'SQL', category: 'Programming', importance: 'high' },
      { name: 'Python/R', category: 'Programming', importance: 'high' },
      { name: 'Data Visualization (Tableau/PowerBI)', category: 'Tools', importance: 'high' },
      { name: 'Statistical Analysis', category: 'Technical', importance: 'high' },
      { name: 'Excel Advanced Functions', category: 'Tools', importance: 'medium' },
      { name: 'Machine Learning Basics', category: 'Technical', importance: 'medium' },
      { name: 'Data Cleaning', category: 'Technical', importance: 'medium' },
      { name: 'Business Intelligence', category: 'Domain Knowledge', importance: 'low' }
    ],
    'Product Manager': [
      { name: 'Product Strategy', category: 'Strategy', importance: 'high' },
      { name: 'User Research', category: 'Research', importance: 'high' },
      { name: 'Roadmap Planning', category: 'Planning', importance: 'high' },
      { name: 'Stakeholder Management', category: 'Communication', importance: 'high' },
      { name: 'Data Analysis', category: 'Technical', importance: 'medium' },
      { name: 'Agile/Scrum', category: 'Methodology', importance: 'medium' },
      { name: 'A/B Testing', category: 'Technical', importance: 'medium' },
      { name: 'Technical Understanding', category: 'Technical', importance: 'low' }
    ]
  };

  const handleAnalyze = () => {
    setLoadingAnalysis(true);
    setTimeout(() => {
      setAnalyzed(true);
      setLoadingAnalysis(false);
    }, 1000);
  };

  const toggleSkill = (skillName: string) => {
    setCurrentSkills(prev =>
      prev.includes(skillName)
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    );
  };

  const requiredSkills = selectedRole ? (allSkills[selectedRole] || []) : [];
  const hasSkills = requiredSkills.filter(skill => currentSkills.includes(skill.name));
  const missingSkills = requiredSkills.filter(skill => !currentSkills.includes(skill.name));
  const skillMatch = requiredSkills.length > 0 
    ? Math.round((hasSkills.length / requiredSkills.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
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
            Skill Gap Analyzer
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600"
          >
            Identify skill gaps between your current abilities and your target role
          </motion.p>
        </div>

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="p-6 border-2 border-black/10">
            <h2 className="text-2xl mb-4">Select Your Target Role</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {roles.map(role => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setAnalyzed(false);
                    setCurrentSkills([]);
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    selectedRole === role
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-black'
                      : 'border-gray-200 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Skills Selection */}
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="p-6 border-2 border-black/10">
              <h2 className="text-2xl mb-4">Select Your Current Skills</h2>
              <div className="space-y-3 mb-6">
                {requiredSkills.map(skill => (
                  <div
                    key={skill.name}
                    onClick={() => toggleSkill(skill.name)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      currentSkills.includes(skill.name)
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{skill.name}</div>
                        <div className="text-sm text-gray-600">{skill.category}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          skill.importance === 'high' ? 'bg-red-100 text-red-700' :
                          skill.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {skill.importance.toUpperCase()}
                        </span>
                        {currentSkills.includes(skill.name) ? (
                          <CheckCircle className="w-6 h-6 text-[#D4AF37]" />
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                onClick={handleAnalyze}
                className="w-full bg-black hover:bg-[#D4AF37] text-white"
                disabled={currentSkills.length === 0 || loadingAnalysis}
              >
                {loadingAnalysis ? 'Analyzing...' : 'Analyze Skill Gap'}
              </Button>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {analyzed && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 border-2 border-[#D4AF37]">
              <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto mb-4 rounded-full border-8 border-[#D4AF37] flex items-center justify-center">
                  <div className="text-4xl font-bold text-[#D4AF37]">{skillMatch}%</div>
                </div>
                <h2 className="text-3xl mb-2">Skill Match Score</h2>
                <p className="text-gray-600">
                  You have {hasSkills.length} out of {requiredSkills.length} required skills
                </p>
              </div>

              {missingSkills.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-semibold text-red-900">Skills to Develop</h3>
                  </div>
                  <div className="space-y-2">
                    {missingSkills
                      .sort((a, b) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return order[a.importance] - order[b.importance];
                      })
                      .map(skill => (
                        <div key={skill.name} className="flex items-center justify-between bg-white p-3 rounded">
                          <span className="font-medium">{skill.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            skill.importance === 'high' ? 'bg-red-100 text-red-700' :
                            skill.importance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {skill.importance.toUpperCase()} PRIORITY
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {hasSkills.length > 0 && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-xl font-semibold text-green-900">Your Strengths</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {hasSkills.map(skill => (
                      <div key={skill.name} className="bg-white p-2 rounded text-sm">
                        {skill.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}