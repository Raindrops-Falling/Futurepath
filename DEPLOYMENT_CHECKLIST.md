# 🚀 FuturePath - Final Deployment Checklist

## ✅ Configuration Status

### Supabase Project
- **Project ID**: `cvtfqsekltaodxhkhell` ✅
- **Config File**: `/src/utils/supabase/info.tsx` ✅
- **KV Table**: `kv_store_ff90fa65` ✅

### Backend Files
- **Edge Function**: `/supabase/functions/server/index.tsx` ✅
- **KV Store Utilities**: `/supabase/functions/server/kv_store.tsx` ✅
- **Email Confirmation**: Auto-enabled ✅

### Frontend Files
- **Signup Page**: Calls backend `/signup` endpoint ✅
- **Login Page**: Uses Supabase auth ✅
- **Profile Page**: Fetches from backend `/profile` endpoint ✅
- **App.tsx**: Auth state management ✅

---

## 📋 Deployment Steps

### Step 1: Deploy Edge Function (REQUIRED)

```bash
# Make sure you're in project root
cd /path/to/futurepath

# Install Supabase CLI if needed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref cvtfqsekltaodxhkhell

# Deploy the function
supabase functions deploy server
```

**Expected Output:**
```
Deploying function server...
Function deployed successfully!
```

### Step 2: Test Backend

```bash
# Test health check
curl https://cvtfqsekltaodxhkhell.supabase.co/functions/v1/make-server-ff90fa65/health
```

**Expected Response:**
```json
{"status":"ok"}
```

### Step 3: Test Signup Flow

1. Go to `http://localhost:5173/signup` (or your dev URL)
2. Fill in the form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: password123
3. Click "Sign Up"
4. Should redirect to home page after successful signup

### Step 4: Verify KV Store Entry

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/cvtfqsekltaodxhkhell
2. Navigate to: Database → Tables → `kv_store_ff90fa65`
3. Look for entry with key: `user:<uuid>`
4. Verify the value matches the structure:

```json
{
  "xp": 0,
  "rank": "Beginner",
  "user_id": "...",
  "full_name": "Test User",
  "games_played": 0,
  "lesson_progress": {
    "course_1": 0,
    "course_2": 0,
    "course_3": 0,
    "course_4": 0,
    "course_5": 0
  },
  "open_ended_questions_done": 0,
  "multiple_choice_questions_done": 0
}
```

### Step 5: Test Login & Profile

1. Go to `/login`
2. Sign in with test account
3. Navigate to `/profile`
4. Verify all data displays correctly:
   - Name shows "Test User"
   - Rank shows "Beginner"
   - All stats show 0 (initially)

---

## 🧪 Testing Endpoints

### Test Add XP

```bash
# Get access token first by logging in
# Then test:

curl -X POST \
  https://cvtfqsekltaodxhkhell.supabase.co/functions/v1/make-server-ff90fa65/add-xp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"xp_amount": 50}'
```

### Test Update Lesson Progress

```bash
curl -X POST \
  https://cvtfqsekltaodxhkhell.supabase.co/functions/v1/make-server-ff90fa65/update-lesson-progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"course_id": "course_1", "progress": 25}'
```

### Test Increment Game

```bash
curl -X POST \
  https://cvtfqsekltaodxhkhell.supabase.co/functions/v1/make-server-ff90fa65/increment-game \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Increment Question

```bash
curl -X POST \
  https://cvtfqsekltaodxhkhell.supabase.co/functions/v1/make-server-ff90fa65/increment-question \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"question_type": "multiple_choice"}'
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Edge function deployed successfully
- [ ] Health check returns `{"status":"ok"}`
- [ ] Can create new user account
- [ ] User entry appears in KV table with correct structure
- [ ] Can log in with created account
- [ ] Profile page loads and shows user data
- [ ] Rank displays correctly (Beginner initially)
- [ ] XP shows 0 initially
- [ ] All counters show 0 initially
- [ ] Course progress shows 0% initially

---

## 🎯 Integration Points

Once backend is deployed, integrate these endpoints into your app:

### Courses/Lessons
- When lesson completed → Call `/update-lesson-progress` + `/add-xp`
- Award 25 XP per lesson

### Questions
- When MCQ answered → Call `/increment-question` + `/add-xp`
- When open-ended submitted → Call `/increment-question` + `/add-xp`
- Award 5 XP per MCQ, 10 XP per open-ended

### Games
- When game completed → Call `/increment-game` + `/add-xp`
- Award 50 XP per game

### Profile Updates
- Profile page already fetches from backend
- No changes needed - it will automatically show updated values

---

## 🐛 Troubleshooting

### "Function not found"
- Redeploy: `supabase functions deploy server`
- Check project ID is correct: `cvtfqsekltaodxhkhell`

### "Unauthorized" error
- Verify access token is valid
- Make sure user is logged in
- Check Authorization header format: `Bearer <token>`

### Profile data not showing
- Check edge function logs in Supabase Dashboard
- Verify KV table entry exists
- Ensure project ID matches in code and Supabase

### Signup not creating KV entry
- Check edge function logs for errors
- Verify KV table `kv_store_ff90fa65` exists
- Ensure SUPABASE_SERVICE_ROLE_KEY is set in edge function env

---

## 📊 Expected Data Flow

```
User Signs Up
     ↓
Backend creates auth user (Supabase Auth)
     ↓
Backend creates KV entry with initial values
     ↓
User logs in (Supabase Auth)
     ↓
Frontend fetches profile from backend
     ↓
Backend reads from KV table
     ↓
Profile displays on frontend
     ↓
User completes activity (lesson/game/question)
     ↓
Frontend calls appropriate endpoint
     ↓
Backend updates KV table
     ↓
Profile page shows updated values
```

---

## ✨ Current Status

**✅ Backend Code**: Complete  
**✅ Frontend Integration**: Complete  
**✅ Data Structure**: Defined  
**✅ Endpoints**: All 8 ready  
**✅ Email Confirmation**: Auto-enabled  
**⏳ Deployment**: Waiting for you  

---

## 🚀 Deploy Now!

Everything is ready. Run this command to deploy:

```bash
supabase functions deploy server
```

Then test signup at: `http://localhost:5173/signup`

---

**You're all set! 🎉**
