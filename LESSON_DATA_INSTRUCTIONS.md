# Lesson Data Implementation Guide

## Central Lesson Data File

**File Location:** `/src/app/data/lessonsData.ts`

This is the ONLY file where lesson data should be stored. All other lesson-related files (including the `/src/app/data/courses/` folder) have been deleted to maintain consistency.

## Current Status

✅ **Implemented:** 
- Lesson 1-1-1: "The Purpose of a Resume and How Employers Use It"
- Lesson 1-1-2: "Core Resume Sections and What to Include"

⏳ **Remaining:** 38 lessons (1-1-3 through 2-5-4)

✅ **Cleanup Completed:**
- Deleted `/src/app/data/courses/course1Module1.ts`
- Verified no imports reference deleted files
- Site is fully functional with current structure

## Structure Format

Each lesson follows this exact format:

```typescript
'courseId-moduleId-lessonId': {
  courseId: number,
  moduleId: number,
  lessonId: number,
  title: string,
  content: string,  // Markdown formatted, 300-400 words
  mcQuestions: [
    {
      question: string,
      options: string[],  // Array of 4 options
      correctAnswer: number,  // Index (0-3)
      explanation: string
    }
    // 5 MCQs total per lesson
  ],
  openEndedQuestions: [
    {
      question: string
    }
    // 2 open-ended questions per lesson
  ]
}
```

## How to Add Lessons

1. Open `/src/app/data/lessonsData.ts`
2. Find the `export const lessons: Record<string, LessonData> = {` section
3. After the last lesson (currently `'1-1-2'`), add a comma and insert new lessons
4. Follow the exact format shown above
5. Use the lesson content you have from the course materials

## Course Structure Reference

### Course 1: Resume Writing (20 lessons)
- **Module 1: Resume Foundations** (4 lessons)
  - ✅ 1-1-1: The Purpose of a Resume and How Employers Use It
  - ✅ 1-1-2: Core Resume Sections and What to Include
  - ⏳ 1-1-3: Writing Effective Bullet Points That Show Impact
  - ⏳ 1-1-4: Formatting, Layout, and Readability Best Practices

- **Module 2: Tailoring Your Resume to the Job** (4 lessons)
  - ⏳ 1-2-1: Analyzing Job Descriptions to Identify What Employers Want
  - ⏳ 1-2-2: Customizing Your Resume Content Without Starting From Scratch
  - ⏳ 1-2-3: Using Keywords Strategically for ATS and Recruiters
  - ⏳ 1-2-4: Highlighting Transferable Skills Across Different Roles

- **Module 3: Resume Content for Different Career Stages** (4 lessons)
  - ⏳ 1-3-1: Building a Resume With Little or No Work Experience
  - ⏳ 1-3-2: Showcasing Experience as a Student or Recent Graduate
  - ⏳ 1-3-3: Mid-Career Resume Strategies: Emphasizing Achievements Over Duties
  - ⏳ 1-3-4: Senior-Level Resume Strategies: Leadership, Results, and Influence

- **Module 4: Advanced Resume Techniques** (4 lessons)
  - ⏳ 1-4-1: Leveraging Achievements and Metrics to Strengthen Your Resume
  - ⏳ 1-4-2: Showcasing Soft Skills Effectively on Your Resume
  - ⏳ 1-4-3: Optimizing Your Resume for Applicant Tracking Systems (ATS)
  - ⏳ 1-4-4: Crafting a Professional Summary That Captures Attention

- **Module 5: Resume Review, Editing, and Finalization** (4 lessons)
  - ⏳ 1-5-1: Conducting a Thorough Self-Review of Your Resume
  - ⏳ 1-5-2: Peer Review and Feedback Strategies for Your Resume
  - ⏳ 1-5-3: Proofreading Techniques to Eliminate Errors and Enhance Clarity
  - ⏳ 1-5-4: Finalizing and Submitting a Polished Resume

### Course 2: Job Applications (20 lessons)
- **Module 1: Understanding Job Postings and Application Requirements** (4 lessons)
- **Module 2: Crafting Effective Job Applications** (4 lessons)
- **Module 3: Mastering Online Job Platforms and Networking** (4 lessons)
- **Module 4: Navigating Specialized Job Opportunities** (4 lessons)
- **Module 5: Advanced Application Strategies** (4 lessons)

## Example Addition

```typescript
  '1-1-2': {
    // ... existing lesson 1-1-2 data
  },
  
  '1-1-3': {
    courseId: 1,
    moduleId: 1,
    lessonId: 3,
    title: 'Writing Effective Bullet Points That Show Impact',
    content: `YOUR LESSON CONTENT HERE`,
    mcQuestions: [
      // Your 5 MCQs here
    ],
    openEndedQuestions: [
      // Your 2 open-ended questions here
    ]
  }
```

## Important Notes

- The site is already fully functional with the current lesson structure
- You can add lessons one at a time or in batches
- Make sure to maintain proper TypeScript formatting
- Each lesson key must be unique: 'courseId-moduleId-lessonId'
- Test after adding each batch to ensure no syntax errors