// Course data structure for FuturePath
// This file will be too large for a single file, so we'll split it into separate files

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface OpenEndedQuestion {
  id: number;
  question: string;
  scenario: string;
}

export interface Lesson {
  id: number;
  title: string;
  content: string;
  questions: Question[];
  openEndedQuestions: OpenEndedQuestion[];
}

export interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  modules: Module[];
}

// Import course-specific data
import { resumeWritingCourse } from './courses/resumeWriting';
import { jobApplicationsCourse } from './courses/jobApplications';

export const courses: Course[] = [
  resumeWritingCourse,
  jobApplicationsCourse,
  {
    id: 3,
    title: 'Interviews',
    description: 'Master the art of interviewing with preparation strategies, common questions, and techniques to impress employers.',
    modules: []
  },
  {
    id: 4,
    title: 'Internships & Networking',
    description: 'Build professional relationships and secure valuable internship opportunities to advance your career.',
    modules: []
  },
  {
    id: 5,
    title: 'Promotions & Career Growth',
    description: 'Navigate career advancement, negotiate raises, and position yourself for long-term professional success.',
    modules: []
  }
];
