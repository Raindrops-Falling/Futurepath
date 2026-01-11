import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { GeometricShapes } from '../components/GeometricShapes';
import { Footer } from '../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

interface Article {
  id: number;
  title: string;
  description: string;
  readTime: string;
  category: string;
  content: string;
}

export function Articles() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [readArticles, setReadArticles] = useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const handleArticleClick = async (article: Article) => {
    setSelectedArticle(article);
    
    // Always track article read when user is authenticated (allow repeats)
    if (isAuthenticated) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { projectId } = await import('../../utils/supabase/info');
          
          // Call backend to track article read with article title
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/increment-articles`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                article_id: article.title  // Use article title instead of ID
              })
            }
          );
        }
      } catch (error) {
        console.error('Error tracking article read:', error);
      }
    }
  };

  const articles: Article[] = [
    {
      id: 1,
      title: 'Navigating Job Interviews in a Competitive Market',
      description: 'Master the art of interviewing with research, practice, and adaptability in today\'s high-stakes job market.',
      readTime: '6 min read',
      category: 'Interview Skills',
      content: `
**Interviews Are More Than Just Questions**

Job interviews are increasingly becoming high-stakes assessments in today's competitive job market. Hiring managers spend an average of just six seconds scanning a resume, and first impressions in interviews often dictate hiring decisions. As more candidates vie for limited opportunities, mastering the art of the interview is essential for career advancement.

**The Psychology of Interview Success**

Success in interviews is not only about what you say but how you present yourself. Soft skills like communication, adaptability, and problem-solving weigh heavily alongside technical expertise. Candidates who demonstrate confidence, active listening, and emotional intelligence often outperform those who rely solely on technical knowledge.

**Preparing Strategically**

Preparation is the cornerstone of interview success:

- **Research the Company**: Understanding the company's culture, products, and recent developments allows for tailored answers and insightful questions.

- **Practice STAR Responses**: Structure responses to behavioral questions with Situation, Task, Action, Result.

- **Simulate Real Interviews**: Mock interviews, both in-person and virtual, improve comfort and confidence under pressure.

**Trends in Modern Interviews**

The rise of AI-powered recruitment platforms means that many interviews begin with digital screening tools. Candidates must also prepare for virtual interviews, video-based assessments, and timed problem-solving tasks. Adapting to these technological changes is crucial for staying competitive.

**Conclusion**

Interviews are both art and science. With research, practice, and adaptability, candidates can maximize their chances of turning opportunities into career growth. In a market where preparation separates success from failure, understanding the evolving landscape of interviews is essential for long-term career progression.
      `
    },
    {
      id: 2,
      title: 'Networking for Career Advancement – Building Connections That Matter',
      description: 'Build meaningful professional connections that drive career mobility, mentorship, and opportunities.',
      readTime: '5 min read',
      category: 'Career Development',
      content: `
**Networking Is No Longer Optional**

Professional networking is increasingly recognized as a critical factor for career development. A significant percentage of jobs are filled through networking, highlighting the importance of building meaningful professional relationships. Networking goes beyond exchanging business cards—it is about cultivating trust and reciprocity over time.

**The Mechanics of Effective Networking**

Effective networking requires both strategy and authenticity:

- **Identify Key Contacts**: Focus on individuals who align with your career goals or possess industry knowledge.

- **Engage Online and Offline**: LinkedIn, professional forums, alumni associations, and conferences provide diverse avenues for connection.

- **Give Before You Receive**: Sharing insights, resources, or introductions helps foster mutual value.

**Overcoming Barriers**

Many professionals struggle with networking due to anxiety or lack of time. Small steps, such as sending follow-up emails after meetings or contributing to online discussions, can gradually expand influence and visibility.

**The Long-Term Payoff**

Networking drives career mobility, mentorship, and access to opportunities not advertised publicly. Mentorship relationships often result in faster promotions and higher satisfaction.

**Conclusion**

Networking is an investment in your career. By nurturing genuine connections and consistently adding value, professionals create a resilient support system capable of unlocking unexpected opportunities throughout their careers.
      `
    },
    {
      id: 3,
      title: 'Crafting Resumes That Open Doors',
      description: 'Create concise, compelling resumes that stand out to employers and pass ATS screening.',
      readTime: '7 min read',
      category: 'Resume Writing',
      content: `
**The Resume Remains a Gateway**

Despite the rise of AI in recruitment, resumes are still the primary tool for introducing candidates to potential employers. A strong resume is concise, relevant, and compelling.

**Essential Components of an Effective Resume**

- **Contact Information**: Clear and professional, including LinkedIn or personal portfolio.

- **Summary/Objective**: Highlight key skills and career goals in 2–3 sentences.

- **Experience**: Emphasize measurable achievements using action verbs (e.g., "led," "achieved," "implemented").

- **Skills and Certifications**: Focus on relevant technical and soft skills.

- **Education**: Include degrees, certifications, or training pertinent to the role.

**Tailoring and Optimization**

Generic resumes rarely succeed. Tailoring a resume to each role, incorporating keywords from job descriptions, and formatting for Applicant Tracking Systems (ATS) increases the chances of advancing to the interview stage.

**Trends and Innovations**

Visual resumes, portfolios, and interactive digital profiles are gaining traction in creative industries. Additionally, AI-driven resume optimization tools help candidates identify gaps or improve clarity. Staying updated on these trends can provide a competitive edge.

**Conclusion**

A well-crafted resume is a career accelerator. By combining clarity, relevance, and evidence-based results, professionals can significantly improve their chances of being noticed in a crowded job market. Strategic resume building is not just about landing a job—it's about shaping your long-term career trajectory.
      `
    }
  ];

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
        <GeometricShapes />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <Button 
            onClick={() => setSelectedArticle(null)}
            variant="ghost"
            className="mb-6 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-[#D4AF37] mb-4 tracking-wider uppercase">{selectedArticle.category} • {selectedArticle.readTime}</p>
            <h1 className="text-5xl mb-8">{selectedArticle.title}</h1>
            
            <Card className="p-10 border-2 border-black/10">
              <div className="prose prose-lg max-w-none">
                {selectedArticle.content.trim().split('\n\n').map((paragraph, index) => {
                  // Handle headers
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    const text = paragraph.slice(2, -2);
                    return <h2 key={index} className="text-3xl mt-8 mb-4">{text}</h2>;
                  }
                  
                  // Handle list items
                  if (paragraph.includes('- **')) {
                    const items = paragraph.split('\n').filter(item => item.trim());
                    return (
                      <ul key={index} className="space-y-3 my-6">
                        {items.map((item, i) => {
                          const cleaned = item.replace(/^- \*\*/, '').replace(/\*\*:/, ':');
                          return <li key={i} className="ml-6 text-gray-700 leading-relaxed">{cleaned}</li>;
                        })}
                      </ul>
                    );
                  }
                  
                  // Regular paragraphs
                  return <p key={index} className="mb-6 text-gray-700 leading-relaxed text-lg">{paragraph}</p>;
                })}
              </div>
            </Card>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Header Section - Centered */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <h1 className="text-6xl mb-6">
            Insights for your <span className="text-[#D4AF37]">career<br />growth</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Expert-written articles covering essential career topics, from interview preparation to resume building.
          </p>
        </motion.div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {articles.map((article, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card 
                onClick={() => handleArticleClick(article)}
                className="p-8 bg-white border-black/10 hover:border-[#D4AF37] transition-all h-full flex flex-col group cursor-pointer"
              >
                <p className="text-xs text-[#D4AF37] mb-3 tracking-wider">{article.readTime}</p>
                <h3 className="text-2xl mb-4 text-black group-hover:text-[#D4AF37] transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600 mb-6 flex-grow leading-relaxed">
                  {article.description}
                </p>
                <div className="flex items-center text-[#D4AF37] group-hover:gap-2 transition-all">
                  <span className="text-sm">Read More</span>
                  <span className="ml-1">→</span>
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