import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { GeometricShapes } from '../components/GeometricShapes';
import { Footer } from '../components/Footer';
import { supabase } from '../lib/supabase';
import { CheckCircle2 } from 'lucide-react';

export function Feedback() {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session?.user);
  };

  const handleSubmit = async () => {
    if (feedback.trim().length < 10) {
      alert('Please provide more detailed feedback (at least 10 characters).');
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in to submit feedback.');
        setLoading(false);
        return;
      }

      const { projectId } = await import('../../utils/supabase/info');
      
      // Get current profile
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      const currentProfile = profileData.profile;

      // Add feedback to array
      const feedbackList = currentProfile.feedback || [];
      feedbackList.push({
        text: feedback,
        date: new Date().toISOString(),
      });

      // Update profile with feedback
      const updateResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            feedback: feedbackList,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl mb-4">We Value Your Feedback</h1>
          <p className="text-xl text-gray-600">
            Help us improve FuturePath by sharing your thoughts and suggestions
          </p>
        </motion.div>

        {!isAuthenticated ? (
          <Card className="p-8 border-2 border-black/10 text-center">
            <p className="text-gray-700 mb-4">Please log in to submit feedback.</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
            >
              Log In
            </Button>
          </Card>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-8 border-2 border-green-500 bg-green-50 text-center">
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
                <h2 className="text-2xl">Thank You!</h2>
                <p className="text-gray-700">
                  Your feedback has been submitted successfully. We appreciate your input!
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white mt-4"
                >
                  Submit More Feedback
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-8 border-2 border-black/10">
              <h3 className="text-xl mb-4">Share Your Thoughts</h3>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you think about FuturePath... What do you like? What could be improved? Any features you'd like to see?"
                className="min-h-[200px] mb-4 border-black/20 focus:border-[#D4AF37]"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {feedback.length} characters
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || feedback.trim().length < 10}
                  className="bg-[#D4AF37] hover:bg-[#B8941F] text-white"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
