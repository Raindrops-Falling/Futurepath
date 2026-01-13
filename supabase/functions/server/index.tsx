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

ENDPOINT REQUIREMENTS

Implemented Endpoints:

Important Notes:
// - XP is awarded on every question submission (including retries)
// - Retry mode updates completedMC/completedOE values and XP is still awarded

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
  oe_detail: {},
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
    allowHeaders: ["Content-Type", "Authorization", "x-anon-id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    // Expose x-anon-id so frontend can read and persist anonymous session id
    exposeHeaders: ["Content-Length", "x-anon-id"],
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
  if (!userData.achievements.first_lesson && userData.completedMC) {
    // Derive completed OE keys from oe_detail
    const completedMCKeys = typeof userData.completedMC === 'object' ? Object.keys(userData.completedMC) : [];
    const completedOEKeys = typeof userData.oe_detail === 'object' ? Object.keys(userData.oe_detail) : [];
    const completedLessons = completedMCKeys.filter(lessonId => completedOEKeys.includes(lessonId));
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

  // Update last activity date
  const today = new Date().toISOString().split('T')[0];
  userData.achievements.last_activity_date = today;
}

// Resolve actor: authenticated user or anonymous session via header `x-anon-id`.
async function resolveActor(c: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );

  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user) return { type: 'unauthenticated' };
    const userData = await kv.get(`user:${user.id}`);
    return { type: 'user', id: user.id, user, data: userData };
  }

  const anonId = c.req.header('x-anon-id');
  if (anonId) {
    const anonDataRaw = await kv.getAnon(`anon:${anonId}`);
    const anonData = ensureAnonData(anonDataRaw || {});
    return { type: 'anon', id: anonId, data: anonData };
  }

  // No anon id provided - create an anonymous session automatically
  try {
    const newAnonId = crypto.randomUUID();
    const anonKey = `anon:${newAnonId}`;
    const anonTemplate = JSON.parse(JSON.stringify(ANON_TEMPLATE));
    // persist a full, normalized anon profile
    await kv.setAnon(anonKey, anonTemplate);
    // Inform the client of the new anon id so it can persist it for future requests
    c.header('x-anon-id', newAnonId);
    return { type: 'anon', id: newAnonId, data: anonTemplate, new: true };
  } catch (err) {
    console.error('Failed to create anon session:', err);
    return { type: 'none' };
  }
}

// Canonical anon template used to initialize and normalize anonymous profiles
const ANON_TEMPLATE = {
  user_id: null,
  full_name: null,
  xp: 0,
  ai_calls: 0,
  rank: 'Beginner',
  feedback: [],
  games_played: 0,
  games_list: [],
  articles_read: 0,
  articles_list: [],
  lesson_progress: { course_1: 0, course_2: 0, course_3: 0, course_4: 0, course_5: 0 },
  open_ended_questions_done: 0,
  multiple_choice_questions_done: 0,
  completedMC: {},
  completedOE: {},
  recent_courses: [],
  corporate_clicker: { money:0, money_per_second:0, last_played: new Date().toISOString(), buildings: { developer:0, manager:0, shareholder:0, ceo:0, investor:0, board_member:0, venture_capitalist:0, hedge_fund:0, conglomerate:0, monopoly:0 } },
    achievements: {
    first_lesson: false,
    first_game: false,
    course_completed: false,
    three_articles: false,
    last_activity_date: null,
    total_lessons_completed: 0,
    total_games_completed: 0,
    xp_milestones: { '100': false, '500': false, '1000': false }
  }
};

// Ensure an anon data object contains the full set of fields (deep-ish merge)
function ensureAnonData(data: any) {
  const base = JSON.parse(JSON.stringify(ANON_TEMPLATE));
  if (!data) return base;
  const merged: any = { ...base, ...data };
  merged.lesson_progress = { ...base.lesson_progress, ...(data.lesson_progress || {}) };
  merged.corporate_clicker = { ...base.corporate_clicker, ...(data.corporate_clicker || {}) };
  merged.corporate_clicker.buildings = { ...base.corporate_clicker.buildings, ...(data.corporate_clicker?.buildings || {}) };
  merged.achievements = { ...base.achievements, ...(data.achievements || {}) };
  merged.completedMC = data.completedMC || {};
  merged.oe_detail = data.oe_detail || data._oe_detail || {};
  merged.feedback = data.feedback || [];
  merged.recent_courses = data.recent_courses || [];
  merged.articles_list = data.articles_list || [];
  merged.games_list = data.games_list || [];
  merged.xp = typeof data.xp === 'number' ? data.xp : base.xp;
  merged.rank = data.rank || base.rank;
  merged.ai_calls = typeof data.ai_calls === 'number' ? data.ai_calls : 0;
  merged.open_ended_questions_done = data.open_ended_questions_done ?? 0;
  merged.multiple_choice_questions_done = data.multiple_choice_questions_done ?? 0;
  merged.games_played = data.games_played ?? 0;
  merged.articles_read = data.articles_read ?? 0;
  return merged;
}

// Ensure a user data object contains canonical fields (similar to anon normalization)
function ensureUserData(data: any, userId: string) {
  const base = {
    xp: 0,
    ai_calls: 0,
    rank: 'Beginner',
    user_id: userId,
    feedback: [],
    full_name: '',
    games_played: 0,
    games_list: [],
    articles_read: 0,
    articles_list: [],
    lesson_progress: { course_1: 0, course_2: 0, course_3: 0, course_4: 0, course_5: 0 },
    open_ended_questions_done: 0,
    multiple_choice_questions_done: 0,
    completedMC: {},
    oe_detail: {},
    recent_courses: [],
    corporate_clicker: { money:0, money_per_second:0, last_played: new Date().toISOString(), buildings: { developer:0, manager:0, shareholder:0, ceo:0, investor:0, board_member:0, venture_capitalist:0, hedge_fund:0, conglomerate:0, monopoly:0 } },
    achievements: {
      first_lesson: false,
      first_game: false,
      course_completed: false,
      three_articles: false,
      last_activity_date: null,
      total_lessons_completed: 0,
      total_games_completed: 0,
      xp_milestones: { '100': false, '500': false, '1000': false }
    }
  };
  if (!data) return base;
  const merged: any = { ...base, ...data };
  merged.lesson_progress = { ...base.lesson_progress, ...(data.lesson_progress || {}) };
  merged.corporate_clicker = { ...base.corporate_clicker, ...(data.corporate_clicker || {}) };
  merged.corporate_clicker.buildings = { ...base.corporate_clicker.buildings, ...(data.corporate_clicker?.buildings || {}) };
  merged.achievements = { ...base.achievements, ...(data.achievements || {}) };
  merged.completedMC = data.completedMC || {};
  merged.oe_detail = data.oe_detail || data._oe_detail || {};
  merged.feedback = data.feedback || [];
  merged.recent_courses = data.recent_courses || [];
  merged.articles_list = data.articles_list || [];
  merged.games_list = data.games_list || [];
  merged.xp = typeof data.xp === 'number' ? data.xp : base.xp;
  merged.rank = data.rank || base.rank;
  merged.ai_calls = typeof data.ai_calls === 'number' ? data.ai_calls : 0;
  merged.open_ended_questions_done = data.open_ended_questions_done ?? 0;
  merged.multiple_choice_questions_done = data.multiple_choice_questions_done ?? 0;
  merged.games_played = data.games_played ?? 0;
  merged.articles_read = data.articles_read ?? 0;
  return merged;
}

// Health check endpoint
app.get("/make-server-ff90fa65/health", (c) => {
  return c.json({ status: "ok" });
});

// Create anonymous session and initialize anon KV entry
app.post("/make-server-ff90fa65/anon-start", async (c) => {
  try {
    const anonId = crypto.randomUUID();
    const anonKey = `anon:${anonId}`;
    const anonTemplate = JSON.parse(JSON.stringify(ANON_TEMPLATE));
    await kv.setAnon(anonKey, anonTemplate);
    return c.json({ success: true, anon_id: anonId });
  } catch (error) {
    console.log('Anon start error:', error);
    return c.json({ error: 'Failed to start anon session: ' + String(error) }, 500);
  }
});

// End anonymous session and optionally wipe data
app.post("/make-server-ff90fa65/anon-end", async (c) => {
  try {
    const { anon_id } = await c.req.json();
    if (!anon_id) return c.json({ error: 'anon_id required' }, 400);
    await kv.delAnon(`anon:${anon_id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Anon end error:', error);
    return c.json({ error: 'Failed to end anon session: ' + String(error) }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-ff90fa65/signup", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const body = await c.req.json();
    const { email, password, full_name, anon_id, anonId } = body;
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
      ai_calls: 0,
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

    // If an anonymous session id is provided, merge its data into the new user
    const suppliedAnonId = anon_id || anonId;
    if (suppliedAnonId) {
      try {
        const anonDataRaw = await kv.getAnon(`anon:${suppliedAnonId}`);
        const anonData = ensureAnonData(anonDataRaw || {});
        if (anonData) {
          // Start with the new user's defaults, then apply anon values so
          // anon progress (including nested corporate_clicker/buildings) is preserved.
          const merged: any = { ...userData, ...anonData };

          // Deep-merge corporate_clicker and its buildings to avoid clobbering nested anon progress
          merged.corporate_clicker = {
            ...(userData.corporate_clicker || {}),
            ...(anonData.corporate_clicker || {}),
          };
          merged.corporate_clicker.buildings = {
            ...(userData.corporate_clicker?.buildings || {}),
            ...(anonData.corporate_clicker?.buildings || {}),
          };

          // Preserve explicitly-supplied signup full_name if provided
          if (full_name) merged.full_name = full_name;

          // Ensure canonical fields are correct for the new user
          merged.user_id = userId;
          merged.xp = merged.xp ?? 0;
          merged.rank = merged.rank ?? 'Beginner';

          await kv.set(`user:${userId}`, merged);
          // Delete anonymous data after migration
          await kv.delAnon(`anon:${suppliedAnonId}`);
          console.log('[SIGNUP] Migrated anon data to new user:', suppliedAnonId, '->', userId);
        } else {
          await kv.set(`user:${userId}`, userData);
        }
      } catch (e) {
        console.log('[SIGNUP] Error merging anon data:', e);
        await kv.set(`user:${userId}`, userData);
      }
    } else {
      await kv.set(`user:${userId}`, userData);
      console.log('[SIGNUP] User profile created in KV store');
    }

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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    if (resolved.type === 'user') {
      if (!resolved.data) return c.json({ error: 'User data not found' }, 404);
      return c.json({ profile: resolved.data });
    }

    // anon
    if (resolved.type === 'anon') {
      // If anon profile doesn't exist, initialize and persist it
      if (!resolved.data) {
        const anonTemplate = JSON.parse(JSON.stringify(ANON_TEMPLATE));
        await kv.setAnon(`anon:${resolved.id}`, anonTemplate);
        return c.json({ profile: anonTemplate, anon_id: resolved.id });
      }
      // return a normalized, full anon profile
      return c.json({ profile: ensureAnonData(resolved.data), anon_id: resolved.id });
    }
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const updates = await c.req.json();

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      const updatedData = { ...currentData, ...updates };
      await kv.set(`user:${resolved.id}`, updatedData);
      return c.json({ success: true, profile: updatedData });
    }

    // anon update
    const currentData = ensureAnonData(resolved.data || {});
    const updatedData = { ...currentData, ...updates };
    await kv.setAnon(`anon:${resolved.id}`, updatedData);
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
      const resolved = await resolveActor(c);
      if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
        return c.json({ error: 'No authorization token or anon session' }, 401);
      }

      const { xp_amount } = await c.req.json();

      if (resolved.type === 'user') {
        const currentData = await kv.get(`user:${resolved.id}`);
        if (!currentData) return c.json({ error: 'User data not found' }, 404);
        currentData.xp += xp_amount;
        // Update rank
        if (currentData.xp >= 1000) currentData.rank = "Expert";
        else if (currentData.xp >= 500) currentData.rank = "Advanced";
        else if (currentData.xp >= 200) currentData.rank = "Intermediate";
        else currentData.rank = "Beginner";
        checkAchievements(currentData, xp_amount);
        await kv.set(`user:${resolved.id}`, currentData);
        return c.json({ success: true, xp: currentData.xp, rank: currentData.rank });
      }

      // anon
      const currentData = ensureAnonData(resolved.data || {});
      currentData.xp = (currentData.xp || 0) + xp_amount;
      if (currentData.xp >= 1000) currentData.rank = "Expert";
      else if (currentData.xp >= 500) currentData.rank = "Advanced";
      else if (currentData.xp >= 200) currentData.rank = "Intermediate";
      else currentData.rank = "Beginner";
      checkAchievements(currentData, xp_amount);
      await kv.setAnon(`anon:${resolved.id}`, currentData);
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { course_id, progress } = await c.req.json();

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      currentData.lesson_progress[course_id] = progress;
      await kv.set(`user:${resolved.id}`, currentData);
      return c.json({ success: true, lesson_progress: currentData.lesson_progress });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    currentData.lesson_progress[course_id] = progress;
    await kv.setAnon(`anon:${resolved.id}`, currentData);
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { course_id, percentage } = await c.req.json();

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      if (!currentData.lesson_progress) currentData.lesson_progress = { course_1:0, course_2:0, course_3:0, course_4:0, course_5:0 };
      const courseKey = `course_${course_id}`;
      if (currentData.lesson_progress[courseKey] !== undefined) {
        currentData.lesson_progress[courseKey] = percentage;
        await kv.set(`user:${resolved.id}`, currentData);
      }
      return c.json({ success: true, progress: percentage, lesson_progress: currentData.lesson_progress });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    const courseKey = `course_${course_id}`;
    if (currentData.lesson_progress[courseKey] !== undefined) {
      currentData.lesson_progress[courseKey] = percentage;
      await kv.setAnon(`anon:${resolved.id}`, currentData);
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      currentData.games_played = (currentData.games_played || 0) + 1;
      currentData.achievements = currentData.achievements || { total_games_completed: 0 };
      currentData.achievements.total_games_completed = (currentData.achievements.total_games_completed || 0) + 1;
      if (currentData.achievements.total_games_completed === 1) currentData.achievements.first_game = true;
      await kv.set(`user:${resolved.id}`, currentData);
      return c.json({ success: true, games_played: currentData.games_played });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    currentData.games_played = (currentData.games_played || 0) + 1;
    currentData.achievements = currentData.achievements || { total_games_completed: 0 };
    currentData.achievements.total_games_completed = (currentData.achievements.total_games_completed || 0) + 1;
    if (currentData.achievements.total_games_completed === 1) currentData.achievements.first_game = true;
    await kv.setAnon(`anon:${resolved.id}`, currentData);
    return c.json({ success: true, games_played: currentData.games_played });
  } catch (error) {
    console.log('Increment game error:', error);
    return c.json({ error: 'Failed to increment game: ' + String(error) }, 500);
  }
});

// Increment AI calls endpoint
app.post("/make-server-ff90fa65/increment-ai-calls", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const resolved = await resolveActor(c);
    if (resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    // If the request included an Authorization header but the token was invalid,
    // resolveActor returns { type: 'unauthenticated' }. In that case, fall back
    // to anonymous handling using x-anon-id if present or by creating a new anon.
    if (resolved.type === 'unauthenticated') {
      try {
        const headerAnon = c.req.header('x-anon-id');
        if (headerAnon) {
          const currentData = ensureAnonData(await kv.getAnon(`anon:${headerAnon}`) || {});
          currentData.ai_calls = (currentData.ai_calls || 0) + 1;
          await kv.setAnon(`anon:${headerAnon}`, currentData);
          return c.json({ success: true, ai_calls: currentData.ai_calls, anon_id: headerAnon });
        }
        // No anon id provided: create one and initialize
        const newAnonId = crypto.randomUUID();
        const anonTemplate = JSON.parse(JSON.stringify(ANON_TEMPLATE));
        anonTemplate.ai_calls = 1;
        await kv.setAnon(`anon:${newAnonId}`, anonTemplate);
        c.header('x-anon-id', newAnonId);
        return c.json({ success: true, ai_calls: anonTemplate.ai_calls, anon_id: newAnonId, created: true });
      } catch (e) {
        console.error('Error falling back to anon for increment-ai-calls:', e);
        return c.json({ error: 'Failed to increment ai calls for unauthenticated request' }, 500);
      }
    }

    if (resolved.type === 'user') {
      let currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) {
        // Create a sensible default profile so we can track ai_calls
        const fallback = {
          xp: 0,
          ai_calls: 1,
          rank: "Beginner",
          user_id: resolved.id,
          feedback: [],
          full_name: '',
          games_played: 0,
          games_list: [],
          articles_read: 0,
          articles_list: [],
          lesson_progress: { course_1: 0, course_2: 0, course_3: 0, course_4: 0, course_5: 0 },
          open_ended_questions_done: 0,
          multiple_choice_questions_done: 0,
          completedMC: {},
          completedOE: {},
          recent_courses: [],
          corporate_clicker: { money: 0, money_per_second: 0, last_played: new Date().toISOString(), buildings: { developer:0, manager:0, shareholder:0, ceo:0, investor:0, board_member:0, venture_capitalist:0, hedge_fund:0, conglomerate:0, monopoly:0 } },
          achievements: {
            first_lesson: false,
            first_game: false,
            course_completed: false,
            five_games: false,
            three_articles: false,
            last_activity_date: null,
            total_lessons_completed: 0,
            total_games_completed: 0,
            xp_milestones: { '100': false, '500': false, '1000': false }
          }
        };
        await kv.set(`user:${resolved.id}`, fallback);
        return c.json({ success: true, ai_calls: fallback.ai_calls, created: true });
      }
      // Normalize user data to ensure `ai_calls` and other canonical fields exist
      currentData = ensureUserData(currentData, resolved.id);
      currentData.ai_calls = (currentData.ai_calls || 0) + 1;
      await kv.set(`user:${resolved.id}`, currentData);
      return c.json({ success: true, ai_calls: currentData.ai_calls });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    currentData.ai_calls = (currentData.ai_calls || 0) + 1;
    await kv.setAnon(`anon:${resolved.id}`, currentData);
    return c.json({ success: true, ai_calls: currentData.ai_calls });
  } catch (error) {
    console.log('Increment AI calls error:', error);
    return c.json({ error: 'Failed to increment ai calls: ' + String(error) }, 500);
  }
});

// Start game endpoint (for Game Starter achievement)
app.post("/make-server-ff90fa65/start-game", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { game_id } = await c.req.json();

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      if (!currentData.games_list) currentData.games_list = [];
      currentData.games_list.push(game_id);
      currentData.games_played = (currentData.games_played || 0) + 1;
      if (!currentData.achievements) currentData.achievements = { total_games_completed: 0 };
      if (!currentData.achievements.first_game) {
        currentData.achievements.first_game = true;
        await kv.set(`user:${resolved.id}`, currentData);
      }
      if (currentData.games_played >= 5) currentData.achievements.five_games = true;
      await kv.set(`user:${resolved.id}`, currentData);
      return c.json({ success: true, first_game: currentData.achievements.first_game });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    if (!currentData.games_list) currentData.games_list = [];
    currentData.games_list.push(game_id);
    currentData.games_played = (currentData.games_played || 0) + 1;
    currentData.achievements = currentData.achievements || { total_games_completed: 0 };
    if (!currentData.achievements.first_game) {
      currentData.achievements.first_game = true;
      await kv.setAnon(`anon:${resolved.id}`, currentData);
    }
    if (currentData.games_played >= 5) currentData.achievements.five_games = true;
    await kv.setAnon(`anon:${resolved.id}`, currentData);
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { question_type, lesson_id, percentage, is_retry, question_index } = await c.req.json(); // "multiple_choice" or "open_ended"

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      if (!currentData.completedMC) currentData.completedMC = {};
      if (!currentData.oe_detail) currentData.oe_detail = {};

      if (question_type === 'multiple_choice') {
        currentData.completedMC[lesson_id] = percentage;
        currentData.multiple_choice_questions_done = (currentData.multiple_choice_questions_done || 0) + 5;
      } else if (question_type === 'open_ended') {
        if (!currentData.oe_detail) currentData.oe_detail = {};
        if (!currentData.oe_detail[lesson_id]) currentData.oe_detail[lesson_id] = [0,0];
        currentData.oe_detail[lesson_id][question_index] = percentage;
        const scoresArray = currentData.oe_detail[lesson_id];
        const agg = Math.round(((scoresArray[0]||0)+(scoresArray[1]||0))/2);
        // Do not persist 'completedOE' as a separate field; oe_detail is authoritative.
        currentData.open_ended_questions_done = (currentData.open_ended_questions_done || 0) + 1;
      }

      await kv.set(`user:${resolved.id}`, currentData);
      return c.json({ 
        success: true, 
        multiple_choice_questions_done: currentData.multiple_choice_questions_done,
        open_ended_questions_done: currentData.open_ended_questions_done,
        completedMC: currentData.completedMC,
        completedOE: currentData.completedOE
      });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    if (!currentData.completedMC) currentData.completedMC = {};
    if (!currentData.oe_detail) currentData.oe_detail = {};

    if (question_type === 'multiple_choice') {
      currentData.completedMC[lesson_id] = percentage;
      currentData.multiple_choice_questions_done = (currentData.multiple_choice_questions_done || 0) + 5;
    } else if (question_type === 'open_ended') {
      if (!currentData.oe_detail) currentData.oe_detail = {};
      if (!currentData.oe_detail[lesson_id]) currentData.oe_detail[lesson_id] = [0,0];
      currentData.oe_detail[lesson_id][question_index] = percentage;
      const scoresArray = currentData.oe_detail[lesson_id];
      const agg = Math.round(((scoresArray[0]||0)+(scoresArray[1]||0))/2);
      currentData.open_ended_questions_done = (currentData.open_ended_questions_done || 0) + 1;
    }

    await kv.setAnon(`anon:${resolved.id}`, currentData);

    // Derive completedOE mapping from oe_detail for response compatibility
    const derivedCompletedOE: any = {};
    Object.keys(currentData.oe_detail || {}).forEach(k => {
      const arr = currentData.oe_detail[k] || [];
      derivedCompletedOE[k] = Math.round(((arr[0]||0)+(arr[1]||0))/2);
    });

    return c.json({ 
      success: true, 
      multiple_choice_questions_done: currentData.multiple_choice_questions_done,
      open_ended_questions_done: currentData.open_ended_questions_done,
      completedMC: currentData.completedMC,
      completedOE: derivedCompletedOE
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { achievement_type, value } = await c.req.json();
    const currentData = resolved.type === 'user' ? (await kv.get(`user:${resolved.id}`)) : ensureAnonData(resolved.data || {});
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

    if (resolved.type === 'user') {
      await kv.set(`user:${resolved.id}`, currentData);
      console.log(`[ACHIEVEMENT] User ${resolved.id} - ${achievement_type} updated`);
    } else {
      await kv.setAnon(`anon:${resolved.id}`, currentData);
      console.log(`[ACHIEVEMENT] Anon ${resolved.id} - ${achievement_type} updated`);
    }

    return c.json({ success: true, achievements: currentData.achievements });
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { course_id } = await c.req.json();
    const currentData = resolved.type === 'user' ? (await kv.get(`user:${resolved.id}`)) : ensureAnonData(resolved.data || {});
    if (!currentData) return c.json({ error: 'User data not found' }, 404);

    if (!currentData.recent_courses) currentData.recent_courses = [];
    currentData.recent_courses = [course_id, ...currentData.recent_courses.filter(id => id !== course_id)];
    if (currentData.recent_courses.length > 3) currentData.recent_courses = currentData.recent_courses.slice(0,3);

    if (resolved.type === 'user') await kv.set(`user:${resolved.id}`, currentData);
    else await kv.setAnon(`anon:${resolved.id}`, currentData);

    return c.json({ success: true, recent_courses: currentData.recent_courses });
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const { article_id } = await c.req.json(); // article_id is now the article title
    const currentData = resolved.type === 'user' ? (await kv.get(`user:${resolved.id}`)) : ensureAnonData(resolved.data || {});
    if (!currentData) return c.json({ error: 'User data not found' }, 404);

    if (!currentData.articles_list) currentData.articles_list = [];
    currentData.articles_list.push(article_id);
    const uniqueArticles = [...new Set(currentData.articles_list)];
    currentData.articles_read = uniqueArticles.length;
    if (!currentData.achievements) currentData.achievements = {};
    if (currentData.articles_read >= 3) currentData.achievements.three_articles = true;
    checkAchievements(currentData);

    if (resolved.type === 'user') await kv.set(`user:${resolved.id}`, currentData);
    else await kv.setAnon(`anon:${resolved.id}`, currentData);

    return c.json({ success: true, articles_read: currentData.articles_read, achievements: currentData.achievements });
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

    const resolved = await resolveActor(c);
    if (resolved.type === 'unauthenticated' || resolved.type === 'none') {
      return c.json({ error: 'No authorization token or anon session' }, 401);
    }

    const payload = await c.req.json();
    const { money, money_per_second, buildings, click_value, production_multiplier, click_percent } = payload;

    if (resolved.type === 'user') {
      const currentData = await kv.get(`user:${resolved.id}`);
      if (!currentData) return c.json({ error: 'User data not found' }, 404);
      currentData.corporate_clicker = currentData.corporate_clicker || {};
      currentData.corporate_clicker.money = money;
      currentData.corporate_clicker.money_per_second = money_per_second;
      currentData.corporate_clicker.buildings = buildings;
      currentData.corporate_clicker.last_played = new Date().toISOString();
      // store optional click fields
      if (typeof click_value !== 'undefined') currentData.corporate_clicker.click_value = click_value;
      if (typeof production_multiplier !== 'undefined') currentData.corporate_clicker.production_multiplier = production_multiplier;
      if (typeof click_percent !== 'undefined') currentData.corporate_clicker.click_percent = click_percent;
      await kv.set(`user:${resolved.id}`, currentData);
      return c.json({ success: true, corporate_clicker: currentData.corporate_clicker });
    }

    // anon
    const currentData = ensureAnonData(resolved.data || {});
    currentData.corporate_clicker = currentData.corporate_clicker || {};
    currentData.corporate_clicker.money = money;
    currentData.corporate_clicker.money_per_second = money_per_second;
    currentData.corporate_clicker.buildings = buildings;
    currentData.corporate_clicker.last_played = new Date().toISOString();
    if (typeof click_value !== 'undefined') currentData.corporate_clicker.click_value = click_value;
    if (typeof production_multiplier !== 'undefined') currentData.corporate_clicker.production_multiplier = production_multiplier;
    if (typeof click_percent !== 'undefined') currentData.corporate_clicker.click_percent = click_percent;
    await kv.setAnon(`anon:${resolved.id}`, currentData);
    return c.json({ success: true, corporate_clicker: currentData.corporate_clicker });
  } catch (error) {
    console.log('Update clicker error:', error);
    return c.json({ error: 'Failed to update clicker: ' + String(error) }, 500);
  }
});



Deno.serve(app.fetch);