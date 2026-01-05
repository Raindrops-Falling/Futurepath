import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { Articles } from './pages/Articles';
import { Courses } from './pages/Courses';
import { Games } from './pages/Games';
import { Profile } from './pages/Profile';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Feedback } from './pages/Feedback';
import { AIChatbot } from './pages/games/AIChatbot';
import { SkillGapAnalyzer } from './pages/games/SkillGapAnalyzer';
import { AIResumeChecker } from './pages/games/AIResumeChecker';
import { CareerSimulation } from './pages/games/CareerSimulation';
import { InterviewSimulator } from './pages/games/InterviewSimulator';
import { SalaryNegotiator } from './pages/games/SalaryNegotiator';
import { CareerPathwayFinder } from './pages/games/CareerPathwayFinder';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-white">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="size-full min-h-screen bg-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <>
                <Navigation isAuthenticated={isAuthenticated} onAuthChange={checkAuth} />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/articles" element={<Articles />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/games/ai-chatbot" element={<AIChatbot />} />
                  <Route path="/games/skill-gap-analyzer" element={<SkillGapAnalyzer />} />
                  <Route path="/games/ai-resume-checker" element={<AIResumeChecker />} />
                  <Route 
                    path="/games/career-simulation" 
                    element={<CareerSimulation />} 
                  />
                  <Route 
                    path="/games/salary-negotiator" 
                    element={<SalaryNegotiator />} 
                  />
                  <Route 
                    path="/games/interview-simulator" 
                    element={<InterviewSimulator />} 
                  />
                  <Route 
                    path="/games/career-pathway-finder" 
                    element={<CareerPathwayFinder />} 
                  />
                  <Route path="/about" element={<About />} />
                  <Route
                    path="/profile"
                    element={
                      isAuthenticated ? (
                        <Profile />
                      ) : (
                        <Navigate to="/login" replace />
                      )
                    }
                  />
                  <Route path="/feedback" element={<Feedback />} />
                </Routes>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}