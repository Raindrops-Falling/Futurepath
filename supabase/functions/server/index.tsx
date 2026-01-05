import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";

/*
================================================================================
BACKEND REQUIREMENTS DOCUMENTATION
================================================================================

This edge function uses a KV store to manage user data. Below are the complete
requirements for the data structure, fields, and achievement logic.

--------------------------------------------------------------------------------
KV STORE DATA STRUCTURE
--------------------------------------------------------------------------------

Key Format: `user:{user_id}`

Value Structure (JSON):
{
  // Core Fields
  user_id: string,
  full_name: string,
  xp: number,
  rank: string, // "Beginner" (0-199), "Intermediate" (200-499), "Advanced" (500-999), "Expert" (1000+)
  
  // Progress Tracking
  games_played: number,
  lesson_progress: {
    course_1: number, // Percentage 0-100
    course_2: number,
    course_3: number,
    course_4: number,
    course_5: number,
  },
  
  // Question Tracking
  open_ended_questions_done: number,
  multiple_choice_questions_done: number,
  completedMC: string[], // Array of lesson IDs like ["1-1-1", "1-1-2", ...]
  completedOE: string[], // Array of lesson IDs like ["1-1-1", "1-1-2", ...]
  
  // NEW FIELDS - Recently Added
  recent_courses: string[], // Array of course IDs like ["1", "2", "3"] - ordered by most recent
  articles_read: number, // Count of articles read
  
  // Feedback
  feedback: any[], // Array of feedback objects from open-ended questions
  
  // Profile
  profile_picture_url: string, // Optional URL to profile picture
  
  // Achievements
  achievements: {
    // Basic Achievements
    first_lesson: boolean,
    first_game: boolean,
    course_completed: boolean,
    
    // NEW ACHIEVEMENTS - Game & Article Based (Removed Streak-Based)
    five_games: boolean, // Complete 5 games
    three_articles: boolean, // Read 3 articles
    
    // Counters (for achievement tracking)
    total_lessons_completed: number,
    total_games_completed: number,
    
    // XP Milestones
    xp_milestones: {
      '100': boolean,
      '500': boolean,
      '1000': boolean,
    },
    
    // LEGACY FIELDS - Still tracked for backwards compatibility but not shown in UI
    streak_days: number,
    max_streak: number,
    last_activity_date: string | null, // ISO date string
  }
}

--------------------------------------------------------------------------------
ACHIEVEMENT LOGIC
--------------------------------------------------------------------------------

Achievements are checked and updated in the checkAchievements() function and
via the /update-achievements endpoint. Here's the logic:

1. XP Milestones (Automatic):
   - xp_milestones['100']: Unlock when xp >= 100
   - xp_milestones['500']: Unlock when xp >= 500
   - xp_milestones['1000']: Unlock when xp >= 1000

2. First Lesson (Triggered):
   - first_lesson: Set to true when achievement_type='lesson_completed' is sent
   - Also auto-sets when total_lessons_completed increments

3. First Game (Triggered):
   - first_game: Set to true when achievement_type='game_completed' is sent
   - Also auto-sets when total_games_completed increments

4. Five Games (NEW - Needs Implementation):
   - five_games: Set to true when total_games_completed >= 5
   - Should be checked whenever game_completed achievement is updated

5. Three Articles (NEW - Needs Implementation):
   - three_articles: Set to true when articles_read >= 3
   - Should be checked whenever articles_read is updated

6. Course Completed (Triggered):
   - course_completed: Set to true when achievement_type='course_completed' is sent
   - Triggered from frontend when a course reaches 100% (both MC and OE completed for all lessons)

7. Daily Streak (LEGACY - Still tracked but not shown):
   - Updates on every activity (add-xp calls)
   - Increments streak_days if last_activity_date was yesterday
   - Resets to 1 if gap > 1 day
   - Updates max_streak if current streak exceeds it

--------------------------------------------------------------------------------
ENDPOINT REQUIREMENTS
--------------------------------------------------------------------------------

Existing Endpoints (Already Implemented):
- POST /make-server-ff90fa65/signup
- GET /make-server-ff90fa65/profile
- PUT /make-server-ff90fa65/profile
- POST /make-server-ff90fa65/add-xp
- POST /make-server-ff90fa65/update-lesson-progress
- POST /make-server-ff90fa65/increment-game
- POST /make-server-ff90fa65/increment-question
- POST /make-server-ff90fa65/update-achievements

New Endpoint Requirements:

1. POST /make-server-ff90fa65/update-recent-courses
   Body: { course_id: string }
   Logic:
   - Add course_id to beginning of recent_courses array
   - Remove duplicates (keep most recent)
   - Limit to max 3 courses
   - Example: ["3", "1", "2"]

2. POST /make-server-ff90fa65/increment-articles
   Body: { article_id?: string } // Optional tracking
   Logic:
   - Increment articles_read by 1
   - Check if articles_read >= 3, set achievements.three_articles = true
   - Call checkAchievements()

Updates Needed to Existing Endpoints:

1. /make-server-ff90fa65/update-achievements
   Add cases for:
   - case 'five_games': Check if total_games_completed >= 5
   - case 'three_articles': Check if articles_read >= 3

2. /make-server-ff90fa65/increment-game
   After incrementing games_played:
   - Also increment achievements.total_games_completed
   - If first game, set achievements.first_game = true
   - If total_games_completed >= 5, set achievements.five_games = true

3. checkAchievements() function
   Add checks for:
   - if (userData.achievements.total_games_completed >= 5) achievements.five_games = true
   - if (userData.articles_read >= 3) achievements.three_articles = true

--------------------------------------------------------------------------------
INITIALIZATION (signup endpoint)
--------------------------------------------------------------------------------

When creating a new user, initialize with:
{
  xp: 0,
  rank: "Beginner",
  user_id: userId,
  feedback: [],
  full_name: full_name || '',
  games_played: 0,
  lesson_progress: {
    course_1: 0,
    course_2: 0,
    course_3: 0,
    course_4: 0,
    course_5: 0,
  },
  open_ended_questions_done: 0,
  multiple_choice_questions_done: 0,
  completedMC: [],
  completedOE: [],
  recent_courses: [], // NEW
  articles_read: 0, // NEW
  achievements: {
    first_lesson: false,
    first_game: false,
    course_completed: false,
    five_games: false, // NEW
    three_articles: false, // NEW
    streak_days: 0,
    max_streak: 0,
    last_activity_date: null,
    total_lessons_completed: 0,
    total_games_completed: 0,
    xp_milestones: {
      '100': false,
      '500': false,
      '1000': false,
    }
  }
}

================================================================================
END OF BACKEND REQUIREMENTS
================================================================================
*/

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to check and update achievements
function checkAchievements(userData: any, xpGained: number = 0): void {
  if (!userData.achievements) {
    userData.achievements = {
      first_lesson: false,
      first_game: false,
      course_completed: false,
      five_games: false,
      three_articles: false,
      streak_days: 0,
      max_streak: 0,
      last_activity_date: null,
      total_lessons_completed: 0,
      total_games_completed: 0,
      xp_milestones: {
        '100': false,
        '500': false,
        '1000': false,
      }
    };
  }

  // Check for first lesson completion - lesson must appear in BOTH completedMC and completedOE
  if (!userData.achievements.first_lesson && userData.completedMC && userData.completedOE) {
    const completedLessons = userData.completedMC.filter((lessonId: string) => 
      userData.completedOE.includes(lessonId)
    );
    if (completedLessons.length > 0) {
      userData.achievements.first_lesson = true;
    }
  }

  // Check XP milestones
  if (userData.xp >= 100 && !userData.achievements.xp_milestones['100']) {
    userData.achievements.xp_milestones['100'] = true;
  }
  if (userData.xp >= 500 && !userData.achievements.xp_milestones['500']) {
    userData.achievements.xp_milestones['500'] = true;
  }
  if (userData.xp >= 1000 && !userData.achievements.xp_milestones['1000']) {
    userData.achievements.xp_milestones['1000'] = true;
  }

  // Check game achievements
  if (userData.achievements.total_games_completed >= 5) {
    userData.achievements.five_games = true;
  }

  // Check article achievements
  if (userData.articles_read && userData.articles_read >= 3) {
    userData.achievements.three_articles = true;
  }

  // Update streak
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = userData.achievements.last_activity_date;

  if (lastActivity !== today) {
    if (lastActivity) {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        userData.achievements.streak_days += 1;
      } else if (diffDays > 1) {
        // Streak broken
        userData.achievements.streak_days = 1;
      }
    } else {
      // First activity
      userData.achievements.streak_days = 1;
    }

    userData.achievements.last_activity_date = today;

    // Update max streak
    if (userData.achievements.streak_days > userData.achievements.max_streak) {
      userData.achievements.max_streak = userData.achievements.streak_days;
    }
  }
}

// Health check endpoint
app.get("/make-server-ff90fa65/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-ff90fa65/signup", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { email, password, full_name } = await c.req.json();
    
    console.log('[SIGNUP] Creating user:', email);
    
    // Create user with Supabase auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.log('[SIGNUP] Auth error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    // Create user data in KV store
    const userId = authData.user?.id;
    if (!userId) {
      return c.json({ error: 'User ID not found' }, 400);
    }

    console.log('[SIGNUP] User created with ID:', userId);

    const userData = {
      xp: 0,
      rank: "Beginner",
      user_id: userId,
      feedback: [],
      full_name: full_name || '',
      games_played: 0,
      lesson_progress: {
        course_1: 0,
        course_2: 0,
        course_3: 0,
        course_4: 0,
        course_5: 0,
      },
      open_ended_questions_done: 0,
      multiple_choice_questions_done: 0,
      completedMC: [],
      completedOE: [],
      recent_courses: [], // NEW
      articles_read: 0, // NEW
      achievements: {
        first_lesson: false,
        first_game: false,
        course_completed: false,
        five_games: false, // NEW
        three_articles: false, // NEW
        streak_days: 0,
        max_streak: 0,
        last_activity_date: null,
        total_lessons_completed: 0,
        total_games_completed: 0,
        xp_milestones: {
          '100': false,
          '500': false,
          '1000': false,
        }
      }
    };

    await kv.set(`user:${userId}`, userData);
    console.log('[SIGNUP] User profile created in KV store');

    return c.json({ success: true, user: authData.user });
  } catch (error) {
    console.log('[SIGNUP] Error:', error);
    return c.json({ error: 'Sign up failed: ' + String(error) }, 500);
  }
});

// Get user profile data
app.get("/make-server-ff90fa65/profile", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.log('Profile fetch - authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    return c.json({ profile: userData });
  } catch (error) {
    console.log('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch profile: ' + String(error) }, 500);
  }
});

// Update user profile data
app.put("/make-server-ff90fa65/profile", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      console.log('Profile update - authorization error:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    const updatedData = { ...currentData, ...updates };
    await kv.set(`user:${user.id}`, updatedData);

    return c.json({ success: true, profile: updatedData });
  } catch (error) {
    console.log('Profile update error:', error);
    return c.json({ error: 'Failed to update profile: ' + String(error) }, 500);
  }
});

// Add XP endpoint
app.post("/make-server-ff90fa65/add-xp", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { xp_amount } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    currentData.xp += xp_amount;

    // Update rank based on XP
    if (currentData.xp >= 1000) {
      currentData.rank = "Expert";
    } else if (currentData.xp >= 500) {
      currentData.rank = "Advanced";
    } else if (currentData.xp >= 200) {
      currentData.rank = "Intermediate";
    } else {
      currentData.rank = "Beginner";
    }

    // Check achievements and update streak
    checkAchievements(currentData, xp_amount);

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[ADD XP] User ${user.id} gained ${xp_amount} XP, total: ${currentData.xp}, rank: ${currentData.rank}`);

    return c.json({ success: true, xp: currentData.xp, rank: currentData.rank });
  } catch (error) {
    console.log('Add XP error:', error);
    return c.json({ error: 'Failed to add XP: ' + String(error) }, 500);
  }
});

// Update lesson progress endpoint
app.post("/make-server-ff90fa65/update-lesson-progress", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { course_id, progress } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    currentData.lesson_progress[course_id] = progress;
    await kv.set(`user:${user.id}`, currentData);

    console.log(`[LESSON PROGRESS] User ${user.id} - ${course_id}: ${progress}%`);

    return c.json({ success: true, lesson_progress: currentData.lesson_progress });
  } catch (error) {
    console.log('Update lesson progress error:', error);
    return c.json({ error: 'Failed to update lesson progress: ' + String(error) }, 500);
  }
});

// Increment game played endpoint
app.post("/make-server-ff90fa65/increment-game", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    currentData.games_played += 1;
    currentData.achievements.total_games_completed += 1;

    if (currentData.achievements.total_games_completed === 1) {
      currentData.achievements.first_game = true;
    }

    if (currentData.achievements.total_games_completed >= 5) {
      currentData.achievements.five_games = true;
    }

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[GAME PLAYED] User ${user.id} - Total games: ${currentData.games_played}`);

    return c.json({ success: true, games_played: currentData.games_played });
  } catch (error) {
    console.log('Increment game error:', error);
    return c.json({ error: 'Failed to increment game: ' + String(error) }, 500);
  }
});

// Start game endpoint (for Game Starter achievement)
app.post("/make-server-ff90fa65/start-game", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Set first_game achievement if this is the first game started
    if (!currentData.achievements.first_game) {
      currentData.achievements.first_game = true;
      await kv.set(`user:${user.id}`, currentData);
      console.log(`[GAME STARTED] User ${user.id} - First game achievement unlocked`);
    }

    return c.json({ success: true, first_game: currentData.achievements.first_game });
  } catch (error) {
    console.log('Start game error:', error);
    return c.json({ error: 'Failed to start game: ' + String(error) }, 500);
  }
});

// Increment question completion endpoint
app.post("/make-server-ff90fa65/increment-question", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { question_type, lesson_id } = await c.req.json(); // "multiple_choice" or "open_ended"
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Ensure arrays exist
    if (!currentData.completedMC) currentData.completedMC = [];
    if (!currentData.completedOE) currentData.completedOE = [];

    if (question_type === 'multiple_choice') {
      currentData.multiple_choice_questions_done += 5; // Add 5 for MCQ section
      // Add lesson to completedMC if not already there
      if (!currentData.completedMC.includes(lesson_id)) {
        currentData.completedMC.push(lesson_id);
      }
    } else if (question_type === 'open_ended') {
      currentData.open_ended_questions_done += 1;
      // Add lesson to completedOE if not already there
      if (!currentData.completedOE.includes(lesson_id)) {
        currentData.completedOE.push(lesson_id);
      }
    }

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[QUESTION COMPLETED] User ${user.id} - ${question_type} for ${lesson_id}`);

    return c.json({ 
      success: true, 
      multiple_choice_questions_done: currentData.multiple_choice_questions_done,
      open_ended_questions_done: currentData.open_ended_questions_done,
      completedMC: currentData.completedMC,
      completedOE: currentData.completedOE
    });
  } catch (error) {
    console.log('Increment question error:', error);
    return c.json({ error: 'Failed to increment question: ' + String(error) }, 500);
  }
});

// Update achievements endpoint
app.post("/make-server-ff90fa65/update-achievements", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { achievement_type, value } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Initialize achievements if not exists
    if (!currentData.achievements) {
      currentData.achievements = {
        first_lesson: false,
        first_game: false,
        course_completed: false,
        five_games: false, // NEW
        three_articles: false, // NEW
        streak_days: 0,
        max_streak: 0,
        last_activity_date: null,
        total_lessons_completed: 0,
        total_games_completed: 0,
        xp_milestones: {
          '100': false,
          '500': false,
          '1000': false,
        }
      };
    }

    // Update specific achievement
    switch (achievement_type) {
      case 'first_lesson':
        currentData.achievements.first_lesson = true;
        break;
      case 'first_game':
        currentData.achievements.first_game = true;
        break;
      case 'course_completed':
        currentData.achievements.course_completed = true;
        break;
      case 'lesson_completed':
        currentData.achievements.total_lessons_completed += 1;
        if (!currentData.achievements.first_lesson) {
          currentData.achievements.first_lesson = true;
        }
        break;
      case 'game_completed':
        currentData.achievements.total_games_completed += 1;
        if (!currentData.achievements.first_game) {
          currentData.achievements.first_game = true;
        }
        if (currentData.achievements.total_games_completed >= 5) {
          currentData.achievements.five_games = true;
        }
        break;
      case 'five_games':
        if (currentData.achievements.total_games_completed >= 5) {
          currentData.achievements.five_games = true;
        }
        break;
      case 'three_articles':
        if (currentData.articles_read >= 3) {
          currentData.achievements.three_articles = true;
        }
        break;
    }

    // Check all achievements and update streak
    checkAchievements(currentData);

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[ACHIEVEMENT] User ${user.id} - ${achievement_type} updated`);

    return c.json({ 
      success: true, 
      achievements: currentData.achievements 
    });
  } catch (error) {
    console.log('Update achievement error:', error);
    return c.json({ error: 'Failed to update achievement: ' + String(error) }, 500);
  }
});

// Update recent courses endpoint
app.post("/make-server-ff90fa65/update-recent-courses", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { course_id } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Add course_id to beginning of recent_courses array
    if (!currentData.recent_courses) currentData.recent_courses = [];
    currentData.recent_courses = [course_id, ...currentData.recent_courses.filter(id => id !== course_id)];

    // Limit to max 3 courses
    if (currentData.recent_courses.length > 3) {
      currentData.recent_courses = currentData.recent_courses.slice(0, 3);
    }

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[RECENT COURSES] User ${user.id} - Updated recent courses: ${currentData.recent_courses}`);

    return c.json({ 
      success: true, 
      recent_courses: currentData.recent_courses 
    });
  } catch (error) {
    console.log('Update recent courses error:', error);
    return c.json({ error: 'Failed to update recent courses: ' + String(error) }, 500);
  }
});

// Increment articles read endpoint
app.post("/make-server-ff90fa65/increment-articles", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'No authorization token' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { article_id } = await c.req.json(); // Optional tracking
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Increment articles_read by 1
    currentData.articles_read += 1;

    // Check if articles_read >= 3, set achievements.three_articles = true
    if (currentData.articles_read >= 3) {
      currentData.achievements.three_articles = true;
    }

    // Call checkAchievements()
    checkAchievements(currentData);

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[ARTICLES READ] User ${user.id} - Total articles read: ${currentData.articles_read}`);

    return c.json({ 
      success: true, 
      articles_read: currentData.articles_read,
      achievements: currentData.achievements
    });
  } catch (error) {
    console.log('Increment articles error:', error);
    return c.json({ error: 'Failed to increment articles: ' + String(error) }, 500);
  }
});

Deno.serve(app.fetch);