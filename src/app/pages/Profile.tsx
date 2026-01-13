import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { fetchWithAuthOrAnon } from '../lib/anon';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { GeometricShapes } from '../components/GeometricShapes';
import { Footer } from '../components/Footer';
import { coursesData } from '../data/lessonsData';

interface UserProfile {
  user_id: string;
  full_name: string;
  games_played: number;
  lesson_progress: {
    course_1: number;
    course_2: number;
    course_3: number;
    course_4: number;
    course_5: number;
  };
  open_ended_questions_done: number;
  xp: number;
  multiple_choice_questions_done: number;
  rank: string;
  profile_picture_url?: string;
  completedMC?: string[];
  completedOE?: string[];
  recent_courses?: string[];
  articles_read?: number;
  achievements?: {
    [key: string]: any;
  };
}

export function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [achievements, setAchievements] = useState<any>(null);
  const [courseProgress, setCourseProgress] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const calculateCourseProgress = (courseId: number, completedMC: string[], completedOE: string[]) => {
    // Get all lessons for this course
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return 0;
    
    let totalLessons = 0;
    course.modules.forEach(module => {
      totalLessons += module.lessons.length;
    });

    // Count how many lessons have both MC and OE completed
    // Lesson IDs are in format "courseId-moduleId-lessonId" e.g., "1-1-1"
    // completedMC and completedOE are now objects, not arrays
    const completedMCKeys = typeof completedMC === 'object' ? Object.keys(completedMC) : [];
    const completedOEKeys = typeof completedOE === 'object' ? Object.keys(completedOE) : [];
    
    const completedMCForCourse = completedMCKeys.filter(id => id.startsWith(`${courseId}-`)).length;
    const completedOEForCourse = completedOEKeys.filter(id => id.startsWith(`${courseId}-`)).length;
    
    // Progress is (completed lessons * 2) / (total lessons * 2) * 100
    const totalCompleted = completedMCForCourse + completedOEForCourse;
    const totalPossible = totalLessons * 2;
    
    return Math.round((totalCompleted / totalPossible) * 100);
  };

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({
          email: session.user.email,
          id: session.user.id,
          created_at: session.user.created_at,
        });
      }

      const { projectId } = await import('../../utils/supabase/info');
      const response = await fetchWithAuthOrAnon(
        `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/profile`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data:', data);
        setProfile(data.profile);
        setAchievements(data.profile.achievements || {});

        // Calculate actual course progress
        const completedMC = data.profile.completedMC || [];
        const completedOE = data.profile.completedOE || [];
        const recentCourses = data.profile.recent_courses || [];

        // Build course progress array
        const progress = [];

        // If no recent courses, leave empty to show CTA
        if (recentCourses.length > 0) {
          for (const courseId of recentCourses.slice(0, 3)) {
            const course = coursesData.find(c => c.id === parseInt(courseId));
            if (course) {
              progress.push({
                id: course.id,
                name: course.title,
                progress: calculateCourseProgress(course.id, completedMC, completedOE)
              });
            }
          }
        }

        setCourseProgress(progress);

        // Trigger achievement check by calling add-xp with 0
        await fetchWithAuthOrAnon(
          `https://${projectId}.supabase.co/functions/v1/make-server-ff90fa65/add-xp`,
          { method: 'POST', body: JSON.stringify({ xp_amount: 0 }) }
        );
      } else {
        console.error('Failed to fetch profile:', await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24 flex items-center justify-center">
        <div className="text-xl text-gray-600">Please log in to view your profile.</div>
      </div>
    );
  }

  // Use full name from profile, or email prefix as fallback
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white text-black relative pt-24">
      <GeometricShapes />
      
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div 
              onClick={handleProfilePictureClick}
              className="w-32 h-32 mx-auto bg-black rounded-full flex items-center justify-center text-white text-4xl cursor-pointer group relative overflow-hidden"
            >
              {profile?.profile_picture_url ? (
                <img 
                  src={profile.profile_picture_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="text-white text-sm">Uploading...</div>
              </div>
            )}
          </div>
          <h1 className="text-5xl mb-2 capitalize">{displayName}</h1>
          <p className="text-lg text-gray-600 mb-4">{user.email}</p>
          <div className="inline-block px-8 py-3 bg-black text-white rounded-full">
            <span className="text-[#D4AF37] font-semibold">{profile?.rank || 'Beginner'}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total XP', value: profile?.xp || 0 },
            { label: 'Multiple Choice Questions', value: profile?.multiple_choice_questions_done || 0 },
            { label: 'Open Ended Questions', value: profile?.open_ended_questions_done || 0 },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="p-6 text-center border-black/10 hover:border-[#D4AF37] transition-all">
                <div className="text-4xl mb-2 text-[#D4AF37]">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Course Progress - White Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="p-8 border-2 border-black/10">
            <h2 className="text-2xl mb-2 text-center">Recent Course Progress</h2>
            <p className="text-center text-sm text-gray-600 mb-8">Your most recently started courses</p>
            {courseProgress.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You haven't started any courses yet!</p>
                <Link to="/courses">
                  <Button className="bg-[#D4AF37] hover:bg-[#B8941F] text-white">
                    Explore Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {courseProgress.map((course) => (
                  <div key={course.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{course.name}</span>
                      <span className="text-sm text-gray-500">
                        {course.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#D4AF37] rounded-full transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Achievements Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8"
        >
          <Card className="p-8 border-black/10">
            <h3 className="text-xl mb-6 text-center">Achievements</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  name: 'First Steps', 
                  desc: 'Complete your first lesson', 
                  locked: !achievements?.first_lesson,
                  key: 'first_lesson'
                },
                { 
                  name: 'XP Beginner', 
                  desc: 'Earn 100 total XP', 
                  locked: !achievements?.xp_milestones?.['100'],
                  key: 'xp_100'
                },
                { 
                  name: 'XP Intermediate', 
                  desc: 'Earn 500 total XP', 
                  locked: !achievements?.xp_milestones?.['500'],
                  key: 'xp_500'
                },
                { 
                  name: 'XP Expert', 
                  desc: 'Earn 1000 total XP', 
                  locked: !achievements?.xp_milestones?.['1000'],
                  key: 'xp_1000'
                },
                { 
                  name: 'Game Starter', 
                  desc: 'Complete your first game', 
                  locked: !achievements?.first_game,
                  key: 'first_game'
                },
                { 
                  name: 'Visitor', 
                  desc: 'Welcome to FuturePath! Your journey begins here.', 
                  locked: false,  // Auto-unlocked for everyone
                  key: 'visitor'
                },
                { 
                  name: 'Article Reader', 
                  desc: 'Read 3 articles', 
                  locked: !achievements?.three_articles,
                  key: 'three_articles'
                },
                { 
                  name: 'Course Master', 
                  desc: 'Finish an entire course', 
                  locked: !achievements?.course_completed,
                  key: 'course_completed'
                },
              ].map((achievement) => (
                <div 
                  key={achievement.key}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    achievement.locked 
                      ? 'border-gray-300 bg-gray-50 opacity-60' 
                      : 'border-[#D4AF37] bg-[#D4AF37]/5'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.locked ? '🔒' : '🏆'}</div>
                  <div className="text-sm font-semibold mb-1">{achievement.name}</div>
                  <div className="text-xs text-gray-600">{achievement.desc}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Account Information - White Box with Centered Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8"
        >
          <Card className="p-8 border-2 border-black/10">
            <h3 className="text-2xl mb-6 text-center">Account Information</h3>
            <div className="space-y-3 text-center max-w-md mx-auto">
              <p className="text-gray-700"><span className="font-semibold text-black">Member Since:</span> {joinDate}</p>
              <p className="text-gray-700"><span className="font-semibold text-black">Email:</span> {user.email}</p>
              {profile?.full_name && (
                <p className="text-gray-700"><span className="font-semibold text-black">Full Name:</span> {profile.full_name}</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}