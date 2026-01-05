# Lesson Content Implementation Guide

## Current Status

The application structure is fully functional with 2 sample lessons implemented (Course 1, Module 1, Lessons 1-2). The lesson system supports:
- Rich markdown content with **bold** and *italic* formatting
- Multiple choice questions (5 per lesson)
- Open-ended questions (2 per lesson)
- Tabbed interface for Content/MCQ/Open-Ended views
- Progress tracking integration

## Where to Add Lesson Content

All lesson content should be added to: `/src/app/data/lessonsData.ts`

## Lesson Data Structure

Each lesson follows this exact structure:

```typescript
'courseId-moduleId-lessonId': {
  courseId: 1,              // Course number (1-5)
  moduleId: 1,              // Module number within course
  lessonId: 1,              // Lesson number within module
  title: 'Lesson Title Here',
  content: `
**Section Heading**

Paragraph text goes here. Use **bold** for emphasis and *italics* for secondary emphasis.

**Another Section**

- Bullet points work
- Like this
- For lists

**Key Takeaways**

- Important point 1
- Important point 2
  `,
  mcQuestions: [
    {
      question: 'Question text here?',
      options: [
        'Option A',
        'Option B',
        'Option C',
        'Option D'
      ],
      correctAnswer: 1,  // Index of correct option (0-3)
      explanation: 'Explanation of why this answer is correct.'
    },
    // ... 4 more questions (5 total)
  ],
  openEndedQuestions: [
    {
      question: 'Open-ended question text here?'
    },
    {
      question: 'Second open-ended question text here?'
    }
  ]
}
```

## Course Structure Reference

### Course 1: Resume Writing (4 modules, ~16 lessons)
- Module 1: Resume Foundations (4 lessons)
  - ✅ 1-1-1: The Purpose of a Resume and How Employers Use It
  - ✅ 1-1-2: Core Resume Sections and What to Include
  - ⏳ 1-1-3: Writing Effective Bullet Points That Show Impact
  - ⏳ 1-1-4: Formatting, Layout, and Readability Best Practices

- Module 2: Content Development (4 lessons)
  - ⏳ 1-2-1: [Content needed]
  - ⏳ 1-2-2: [Content needed]
  - ⏳ 1-2-3: [Content needed]
  - ⏳ 1-2-4: [Content needed]

- Module 3: Optimization and Tailoring (4 lessons)
  - ⏳ 1-3-1: [Content needed]
  - ⏳ 1-3-2: [Content needed]
  - ⏳ 1-3-3: [Content needed]
  - ⏳ 1-3-4: [Content needed]

- Module 4: Review and Submission (4 lessons)
  - ⏳ 1-4-1: [Content needed]
  - ⏳ 1-4-2: [Content needed]
  - ⏳ 1-4-3: [Content needed]
  - ⏳ 1-4-4: [Content needed]

### Course 2: Job Applications (5 modules, ~20 lessons)
- Module 1-5: [Content structure defined in courseData.ts]

### Courses 3-5: [Placeholders for future content]

## How to Add a New Lesson

1. Open `/src/app/data/lessonsData.ts`
2. Find the `export const lessons: Record<string, LessonData> = {` section
3. Add a new entry using the pattern above
4. The lesson key must match the format: `'courseId-moduleId-lessonId'`
5. Ensure you have:
   - Meaningful title
   - 300-400 words of content with proper markdown formatting
   - Exactly 5 multiple choice questions
   - Exactly 2 open-ended questions

## Example: Adding Lesson 1-1-3

```typescript
  '1-1-3': {
    courseId: 1,
    moduleId: 1,
    lessonId: 3,
    title: 'Writing Effective Bullet Points That Show Impact',
    content: `
**Lesson Overview**

[Your 300-400 word lesson content here...]

**Key Takeaways**

- Point 1
- Point 2
- Point 3
    `,
    mcQuestions: [
      {
        question: 'Which bullet point best demonstrates impact?',
        options: [
          'Assisted with office tasks',
          'Helped customers',
          'Organized files',
          'Streamlined filing system to improve document retrieval speed by 40%'
        ],
        correctAnswer: 3,
        explanation: 'This bullet shows clear action and quantifiable result.'
      },
      // ... 4 more questions
    ],
    openEndedQuestions: [
      {
        question: 'Think about a past job or project. Rewrite one weak bullet point into a stronger one that shows action and impact.'
      },
      {
        question: 'A hiring manager says your experience sounds "generic." How would you revise your bullet points to better reflect your contributions?'
      }
    ]
  },
```

## Verification

After adding lessons:
1. The lesson will automatically appear in the Courses page
2. Click "Start" to view the lesson
3. Test all three tabs (Content, MCQ, Open-Ended)
4. Verify markdown formatting displays correctly

## Notes

- The system is scalable - add lessons in any order
- Lessons without content will show "Coming soon" and have disabled Start buttons
- All content should align with the professional, career-focused tone of FuturePath
- Use real-world scenarios and practical examples in lesson content
