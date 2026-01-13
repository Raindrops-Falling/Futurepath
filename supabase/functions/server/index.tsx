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

Key Format: `user:{user_id}` for authenticated users
Key Format: `anon:{cookie_id}` for anonymous users (TRACKING ONLY - NOT MERGED)

Value Structure (JSON):
{
  // Core Fields
  user_id: string,
  full_name: string,
  xp: number,
  rank: string, // "Beginner" (0-199), "Intermediate" (200-499), "Advanced" (500-999), "Expert" (1000+)
  
  // Progress Tracking
  games_played: number, // Count of UNIQUE games played
  games_list: string[], // List of all unique game IDs visited
  articles_read: number, // Count of UNIQUE articles read
  articles_list: string[], // List of all unique article IDs visited
  
  lesson_progress: {
    course_1: number, // Percentage 0-100 (auto-calculated from lesson completion)
    course_2: number,
    course_3: number,
    course_4: number,
    course_5: number,
  },
  
  // Question Tracking - Object with lesson_id:percentage
  open_ended_questions_done: number, // Total count (includes retries)
  multiple_choice_questions_done: number, // Total count (includes retries)
  completedMC: { [key: string]: number }, // { "1-1-1": 60, "1-1-2": 100, ... }
  completedOE: { [key: string]: number }, // { "1-1-1": 50, "3-3-1": 100, ... }
  
  // Recent Activity
  recent_courses: string[], // Array of course IDs like ["1", "2", "3"] - ordered by most recent
  
  // Feedback
  feedback: any[], // Array of feedback objects from open-ended questions
  
  // Profile
  profile_picture_url: string, // Optional URL to profile picture
  
  // Corporate Clicker Game State
  corporate_clicker: {
    money: number,
    money_per_second: number,
    last_played: string, // ISO timestamp
    buildings: {
      developer: number,
      manager: number,
      shareholder: number,
      ceo: number,
      investor: number,
      board_member: number,
      venture_capitalist: number,
      hedge_fund: number,
      conglomerate: number,
      monopoly: number,
    }
  },
  
  // Achievements
  achievements: {
    // Basic Achievements
    first_lesson: boolean,
    first_game: boolean,
    course_completed: boolean,
    
    // Game & Article Based
    five_games: boolean, // Complete 5 unique games
    three_articles: boolean, // Read 3 unique articles
    
    // Counters (for achievement tracking)
    total_lessons_completed: number,
    total_games_completed: number,
    
    // XP Milestones
    xp_milestones: {
      '100': boolean,
      '500': boolean,
      '1000': boolean,
    },
    
    // Activity tracking (no longer used for streaks in UI)
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

4. Five Games:
   - five_games: Set to true when games_played >= 5 (unique games)
   - Should be checked whenever game is started

5. Three Articles:
   - three_articles: Set to true when articles_read >= 3 (unique articles)
   - Should be checked whenever articles_read is updated

6. Course Completed (Triggered):
   - course_completed: Set to true when achievement_type='course_completed' is sent
   - Triggered from frontend when a course reaches 100%

--------------------------------------------------------------------------------
ENDPOINT REQUIREMENTS
--------------------------------------------------------------------------------

Implemented Endpoints:
- POST /make-server-ff90fa65/signup
- GET /make-server-ff90fa65/profile
- PUT /make-server-ff90fa65/profile
- POST /make-server-ff90fa65/add-xp
- POST /make-server-ff90fa65/update-lesson-progress (manual progress update)
- POST /make-server-ff90fa65/update-course-progress (auto-calculates based on lessons)
- POST /make-server-ff90fa65/increment-game
- POST /make-server-ff90fa65/start-game
- POST /make-server-ff90fa65/increment-question
- POST /make-server-ff90fa65/update-achievements
- POST /make-server-ff90fa65/update-recent-courses
- POST /make-server-ff90fa65/increment-articles
- POST /make-server-ff90fa65/update-clicker
- GET /make-server-ff90fa65/anon-profile

Important Notes:
- XP is only awarded on FIRST completion of questions, NOT on retries
- Retry mode updates completedMC/completedOE values but does NOT award XP
- Retries DO increment question counts (for profile stats)
- Course progress auto-calculates based on completed lessons (both MC + OE)
- Anonymous user data is for TRACKING ONLY and is NOT merged on signup

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
  games_list: [],
  articles_read: 0,
  articles_list: [],
  lesson_progress: {
    course_1: 0,
    course_2: 0,
    course_3: 0,
    course_4: 0,
    course_5: 0,
  },
  open_ended_questions_done: 0,
  multiple_choice_questions_done: 0,
  completedMC: {},
  completedOE: {},
  recent_courses: [],
  corporate_clicker: {
    money: 0,
    money_per_second: 0,
    last_played: new Date().toISOString(),
    buildings: {
      developer: 0,
      manager: 0,
      shareholder: 0,
      ceo: 0,
      investor: 0,
      board_member: 0,
      venture_capitalist: 0,
      hedge_fund: 0,
      conglomerate: 0,
      monopoly: 0,
    }
  },
  achievements: {
    first_lesson: false,
    first_game: false,
    course_completed: false,
    five_games: false,
    three_articles: false,
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
    // Check if both are objects (new format)
    if (typeof userData.completedMC === 'object' && typeof userData.completedOE === 'object') {
      const completedMCKeys = Object.keys(userData.completedMC);
      const completedOEKeys = Object.keys(userData.completedOE);
      const completedLessons = completedMCKeys.filter(lessonId => completedOEKeys.includes(lessonId));
      if (completedLessons.length > 0) {
        userData.achievements.first_lesson = true;
      }
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

  // Update last activity date
  const today = new Date().toISOString().split('T')[0];
  userData.achievements.last_activity_date = today;
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
      games_list: [],
      articles_read: 0,
      articles_list: [],
      lesson_progress: {
        course_1: 0,
        course_2: 0,
        course_3: 0,
        course_4: 0,
        course_5: 0,
      },
      open_ended_questions_done: 0,
      multiple_choice_questions_done: 0,
      completedMC: {},
      completedOE: {},
      recent_courses: [],
      corporate_clicker: {
        money: 0,
        money_per_second: 0,
        last_played: new Date().toISOString(),
        buildings: {
          developer: 0,
          manager: 0,
          shareholder: 0,
          ceo: 0,
          investor: 0,
          board_member: 0,
          venture_capitalist: 0,
          hedge_fund: 0,
          conglomerate: 0,
          monopoly: 0,
        }
      },
      achievements: {
        first_lesson: false,
        first_game: false,
        course_completed: false,
        five_games: false,
        three_articles: false,
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

// Update course progress endpoint (based on lesson completion)
app.post("/make-server-ff90fa65/update-course-progress", async (c) => {
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

    const { course_id, percentage } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Ensure lesson_progress object exists
    if (!currentData.lesson_progress) {
      currentData.lesson_progress = {
        course_1: 0,
        course_2: 0,
        course_3: 0,
        course_4: 0,
        course_5: 0,
      };
    }

    // Directly store the percentage provided by the frontend
    const courseKey = `course_${course_id}`;
    if (currentData.lesson_progress[courseKey] !== undefined) {
      currentData.lesson_progress[courseKey] = percentage;
      await kv.set(`user:${user.id}`, currentData);
      
      console.log(`[COURSE PROGRESS] User ${user.id} - Course ${course_id}: ${percentage}%`);
    }

    return c.json({ success: true, progress: percentage, lesson_progress: currentData.lesson_progress });
  } catch (error) {
    console.log('Update course progress error:', error);
    return c.json({ error: 'Failed to update course progress: ' + String(error) }, 500);
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

    const { game_id } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Add game_id to games_list if not already present
    if (!currentData.games_list.includes(game_id)) {
      currentData.games_list.push(game_id);
      currentData.games_played += 1;
    }

    // Set first_game achievement if this is the first game started
    if (!currentData.achievements.first_game) {
      currentData.achievements.first_game = true;
      await kv.set(`user:${user.id}`, currentData);
      console.log(`[GAME STARTED] User ${user.id} - First game achievement unlocked`);
    }

    // Check if games_played >= 5, set achievements.five_games = true
    if (currentData.games_played >= 5) {
      currentData.achievements.five_games = true;
    }

    await kv.set(`user:${user.id}`, currentData);

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

    const { question_type, lesson_id, percentage, is_retry, question_index } = await c.req.json(); // "multiple_choice" or "open_ended"
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Ensure objects exist
    if (!currentData.completedMC) currentData.completedMC = {};
    if (!currentData.completedOE) currentData.completedOE = {};

    if (question_type === 'multiple_choice') {
      // Always update the percentage (even on retry)
      currentData.completedMC[lesson_id] = percentage;
      
      // Always increment count (including retries)
      currentData.multiple_choice_questions_done += 5; // Add 5 for MCQ section
    } else if (question_type === 'open_ended') {
      // Maintain per-question detail in a separate internal map to compute aggregate
      if (!currentData._oe_detail) currentData._oe_detail = {};
      if (!currentData._oe_detail[lesson_id]) currentData._oe_detail[lesson_id] = [0, 0];

      // Update the specific question score (question_index is 0 or 1)
      currentData._oe_detail[lesson_id][question_index] = percentage;

      // Compute aggregate percentage for the lesson (average of both questions)
      const scoresArray = currentData._oe_detail[lesson_id];
      const agg = Math.round(( (scoresArray[0] || 0) + (scoresArray[1] || 0) ) / 2);

      // Store aggregate percentage in completedOE for easier progress calculation
      currentData.completedOE[lesson_id] = agg;

      // Always increment count (including retries)
      currentData.open_ended_questions_done += 1;
    }

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[QUESTION ${is_retry ? 'RETRY' : 'COMPLETED'}] User ${user.id} - ${question_type} for ${lesson_id}${question_type === 'open_ended' ? ` (Q${question_index})` : ''}: ${percentage}%`);

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

    const { article_id } = await c.req.json(); // article_id is now the article title
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Always add article_id to articles_list (allow repeats)
    currentData.articles_list.push(article_id);
    
    // Count unique articles for articles_read
    const uniqueArticles = [...new Set(currentData.articles_list)];
    currentData.articles_read = uniqueArticles.length;

    // Check if articles_read >= 3, set achievements.three_articles = true
    if (currentData.articles_read >= 3) {
      currentData.achievements.three_articles = true;
    }

    // Call checkAchievements()
    checkAchievements(currentData);

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[ARTICLES READ] User ${user.id} - Total unique articles: ${currentData.articles_read}, Total reads: ${currentData.articles_list.length}`);

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

// Update corporate clicker endpoint
app.post("/make-server-ff90fa65/update-clicker", async (c) => {
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

    const { money, money_per_second, buildings } = await c.req.json();
    const currentData = await kv.get(`user:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    // Update corporate_clicker state with values from frontend
    currentData.corporate_clicker.money = money;
    currentData.corporate_clicker.money_per_second = money_per_second;
    currentData.corporate_clicker.buildings = buildings;
    currentData.corporate_clicker.last_played = new Date().toISOString();

    await kv.set(`user:${user.id}`, currentData);

    console.log(`[CORPORATE CLICKER] User ${user.id} - Updated clicker state`);

    return c.json({ 
      success: true, 
      corporate_clicker: currentData.corporate_clicker
    });
  } catch (error) {
    console.log('Update clicker error:', error);
    return c.json({ error: 'Failed to update clicker: ' + String(error) }, 500);
  }
});



Deno.serve(app.fetch);