# Implementation Plan - FuturePath Updates

## ✅ Completed
1. **Module 2 for Course 5** - Added "Building Your Professional Brand" with 5 lessons
2. **Articles Updated** - Reduced to 3 articles with full content:
   - Navigating Job Interviews in a Competitive Market
   - Networking for Career Advancement
   - Crafting Resumes That Open Doors

## 🔄 In Progress / To Do

### 1. XP System Updates
**Current**: Not tracking XP properly
**New Requirements**:
- Multiple Choice: 1 XP per question (5 total per lesson)
- Open-Ended: 2 XP per question (4 total per lesson)
- Chatbot/Resume Checker/Skill Gap: 3 XP per session
- Interactive Games: 15 XP per completion

**Files to Update**:
- `/supabase/functions/make-server-ff90fa65/index.ts` - Add XP tracking
- `/src/app/components/LessonView.tsx` - Update XP calls
- `/src/app/pages/games/*.tsx` - Add XP tracking to each game

### 2. Career Simulation Game
**Requirements**:
- 4 attributes: Salary, Network, Skills, Happiness
- 30 events (10 low, 10 medium, 10 high impact)
- Event selection based on current stats
- Save progress to backend

**Files to Create/Update**:
- `/src/app/pages/games/CareerSimulation.tsx` - New game
- `/src/app/pages/Games.tsx` - Add link to new game

### 3. Interview Simulator & Salary Negotiator
**Requirements**:
- AI feedback on every response
- Cap input at 512 tokens
- Track completion for 15 XP

**Files to Update**:
- `/src/app/pages/games/InterviewSimulator.tsx` - Add AI feedback
- `/src/app/pages/games/SalaryNegotiator.tsx` - Add AI feedback

### 4. Validation Updates
**Requirements**:
- Username: no symbols/numbers
- Password: minimum 6 characters

**Files to Update**:
- `/src/app/pages/Signup.tsx`
- `/src/app/pages/Login.tsx` (password validation)

### 5. Profile Progress Calculation
**Current**: Shows "0 questions done"
**New Formula**: (completed lessons / total lessons * 2) * 100 = percentage

**Files to Update**:
- `/src/app/pages/Profile.tsx`

### 6. MCQ/OE Retry Logic
**Current**: Shows 0% and empty answers
**New**: Show "You answered these already, want to try again or get new questions?"
- Try again: Reset answers
- New questions: AI generates new questions based on lesson content

**Files to Update**:
- `/src/app/components/LessonView.tsx`

### 7. Career Pathway Finder
**Requirements**:
- 24 questions
- 8 career directions
- 7 dimensions
- Results on the spot

**Files to Create**:
- `/src/app/pages/games/CareerPathwayFinder.tsx`
- `/src/app/pages/Games.tsx` - Add link

### 8. Achievement Tracking
**Requirements**:
- Track various achievements
- Display on profile

**Files to Update**:
- Backend KV store structure
- `/src/app/pages/Profile.tsx`

---

## Priority Order
1. ✅ Module 2 for Course 5
2. ✅ Articles Update
3. XP System (critical for user engagement)
4. MCQ/OE Retry Logic (improves UX)
5. Profile Progress Calculation
6. Validation Updates
7. Career Simulation Game
8. Interview Simulator AI Feedback
9. Salary Negotiator AI Feedback
10. Career Pathway Finder
11. Achievement Tracking

---

## Notes
- All AI calls use OpenRouter API key: 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
- Model: meta-llama/llama-3.2-3b-instruct:free
- Backend uses KV store with keys: `user:{user_id}`
- All games need to call backend to update XP and track completion
