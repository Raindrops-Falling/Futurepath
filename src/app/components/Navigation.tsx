import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  isAuthenticated: boolean;
  onAuthChange: () => void;
}

export function Navigation({ isAuthenticated, onAuthChange }: NavigationProps) {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { projectId } = await import('../../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear anon session on explicit logout so anon data resets as users expect
      try { localStorage.removeItem('anon_id'); } catch (e) { /* ignore */ }
      onAuthChange();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl tracking-tight font-semibold">
          <span className="text-black">Future</span>
          <span className="text-[#D4AF37]">Path</span>
        </Link>
        
        {/* Desktop Navigation - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="hover:text-[#D4AF37] transition-colors">
            Home
          </Link>
          <Link to="/articles" className="hover:text-[#D4AF37] transition-colors">
            Articles
          </Link>
          <Link to="/courses" className="hover:text-[#D4AF37] transition-colors">
            Courses
          </Link>
          <Link to="/games" className="hover:text-[#D4AF37] transition-colors">
            Games
          </Link>
          <Link to="/about" className="hover:text-[#D4AF37] transition-colors">
            About
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hover:text-[#D4AF37] transition-colors">
                Profile
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-black hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition-all"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button
                variant="outline"
                className="border-black hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition-all"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
        
        {/* Mobile Menu Button - Only Visible on Mobile */}
        <div className="md:hidden">
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            size="sm"
            className="hover:bg-[#D4AF37]/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-black/10">
          <div className="px-6 py-4 flex flex-col gap-4">
            <Link 
              to="/" 
              className="hover:text-[#D4AF37] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/articles" 
              className="hover:text-[#D4AF37] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Articles
            </Link>
            <Link 
              to="/courses" 
              className="hover:text-[#D4AF37] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <Link 
              to="/games" 
              className="hover:text-[#D4AF37] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Games
            </Link>
            <Link 
              to="/about" 
              className="hover:text-[#D4AF37] transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  className="hover:text-[#D4AF37] transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="border-black hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition-all w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="border-black hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-white transition-all w-full"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}