# Structural Changes Summary - January 2026

## Major Backend Changes Implemented

### 1. Data Structure Changes

#### Completed Questions Format
- **OLD**: `completedMC: string[]` (e.g., `["1-1-1", "1-1-2"]`)
- **NEW**: `completedMC: { [key: string]: number }` (e.g., `{ "1-1-1": 60, "1-1-2": 100 }`)
- **OLD**: `completedOE: string[]`
- **NEW**: `completedOE: { [key: string]: number }` (e.g., `{ "1-1-1": 50, "3-3-1": 100 }`)

#### Games & Articles Tracking
- **Added**: `games_list: string[]` - List of all game IDs visited
- **Changed**: `games_played: number` - Now counts UNIQUE games only
- **Added**: `articles_list: string[]` - List of all article IDs visited
- **Changed**: `articles_read: number` - Now counts UNIQUE articles only

#### Achievements
- **Removed**: `streak_days` and `max_streak` (still tracked but not displayed in UI)
- **Kept**: `last_activity_date` for future use

#### Corporate Clicker Game State
- **Added**: Complete game state storage in KV table:
  ```json
  {
    "corporate_clicker": {
      "money": 0,
      "money_per_second": 0,
      "last_played": "2026-01-09T...",
      "buildings": {
        "developer": 0,
        "manager": 0,
        "shareholder": 0,
        "ceo": 0,
        "investor": 0,
        "board_member": 0,
        "venture_capitalist": 0,
        "hedge_fund": 0,
        "conglomerate": 0,
        "monopoly": 0
      }
    }
  }
  ```

### 2. New Endpoints

1. **POST /make-server-ff90fa65/update-clicker**
   - Updates Corporate Clicker game state
   - Calculates idle earnings based on time elapsed

2. **GET /make-server-ff90fa65/anon-profile**
   - Gets or creates anonymous user profile
   - Uses cookie_id as identifier

3. **POST /make-server-ff90fa65/transfer-anon-data**
   - Transfers anonymous user data to authenticated user
   - Only used on signup (not login)

### 3. Modified Endpoints

1. **POST /make-server-ff90fa65/increment-question**
   - Now accepts `percentage` parameter
   - Stores lesson completion as percentage (0-100)
   - Format: `{ "1-1-1": 60 }` means 60% completion

2. **POST /make-server-ff90fa65/start-game**
   - Now accepts `game_id` parameter
   - Adds to `games_list` if unique
   - Increments `games_played` only for unique games

3. **POST /make-server-ff90fa65/increment-articles**
   - Now requires `article_id` parameter
   - Adds to `articles_list` if unique
   - Increments `articles_read` only for unique articles

## Frontend Changes Needed

### 1. LessonView Component
- [ ] Individual retry buttons for MC and OE
- [ ] Calculate MC percentage based on correct answers
- [ ] Update AI prompt for OE to return 0-100 score
- [ ] Send percentage to increment-question endpoint
- [ ] Update progress calculation to use percentages

### 2. Progress Tracking
- [ ] Update mini progress bars to calculate from percentage objects
- [ ] Multiply lesson progress by percentage values
- [ ] Update course progress calculation

### 3. Corporate Clicker Game
- [ ] Create new game component
- [ ] Implement idle clicker mechanics
- [ ] 10 building types with increasing costs
- [ ] Sync with backend KV store
- [ ] Add to highlighted games section

### 4. Resume Checker
- [ ] Add "Deep Response" button
- [ ] Implement AI grading similar to other games
- [ ] Use OpenRouter API

### 5. Anonymous User System
- [ ] Implement cookie storage
- [ ] Use anon-profile endpoint for non-logged-in users
- [ ] Transfer data on signup
- [ ] Do not transfer on login

## Implementation Priority

1. ✅ Backend data structure updates
2. ⏳ LessonView individual retry buttons
3. ⏳ MC percentage calculation
4. ⏳ OE AI grading (0-100)
5. ⏳ Progress calculation updates
6. ⏳ Corporate Clicker game
7. ⏳ Resume Checker deep response
8. ⏳ Anonymous user cookie system

## Notes

- All percentage values should be decimals (0-100)
- MC percentage: (correct answers / total questions) * 100
- OE percentage: AI-graded 0-100 (lenient grading)
- Lesson progress: average of MC% and OE%
- Module progress: average of all lessons in module
- Course progress: average of all modules in course
