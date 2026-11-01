/**
 * Core TypeScript interfaces for the Driving Theory Test application
 */

// ==================== Questions ====================

export type LicenseType = 'A' | 'A1' | 'A2' | 'B' | 'C' | 'C1' | 'D' | 'D1' | '1';

export type QuestionCategory = 
  | 'חוקי התנועה'
  | 'תמרורים'
  | 'בטיחות בדרכים'
  | 'הכרת הרכב'
  | 'נהיגה נכונה'
  | 'כללי';

export interface Question {
  id: string;
  questionNumber: string;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  category: QuestionCategory;
  imageUrl: string | null;
  licenseTypes: LicenseType[];
}

// ==================== Leitner System ====================

export type LeitnerBox = 1 | 2 | 3 | 4 | 5;

export interface LeitnerCard {
  questionId: string;
  box: LeitnerBox;
  lastReviewed: string; // ISO date
  nextReview: string;   // ISO date
  correctStreak: number;
  totalAttempts: number;
  correctAttempts: number;
}

// Box intervals in days
export const LEITNER_INTERVALS: Record<LeitnerBox, number> = {
  1: 1,   // Every day
  2: 2,   // Every 2 days
  3: 4,   // Every 4 days
  4: 8,   // Every 8 days
  5: 16,  // Every 16 days
};

// ==================== Exam ====================

export interface ExamConfig {
  licenseType: LicenseType;
  totalQuestions: number;
  timeLimitMinutes: number;
  maxErrors: number;
}

export const EXAM_CONFIGS: Record<string, ExamConfig> = {
  B: { licenseType: 'B', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
  A: { licenseType: 'A', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
  C: { licenseType: 'C', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
  C1: { licenseType: 'C1', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
  D: { licenseType: 'D', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
  D1: { licenseType: 'D1', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
  '1': { licenseType: '1', totalQuestions: 30, timeLimitMinutes: 40, maxErrors: 4 },
};

export interface ExamAnswer {
  questionId: string;
  selectedAnswerIndex: number | null;
  isCorrect: boolean;
  timeTaken: number; // seconds
  flagged: boolean;
}

export interface ExamResult {
  id: string;
  licenseType: LicenseType;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  score: number; // percentage
  passed: boolean;
  answers: ExamAnswer[];
  timeTaken: number; // total seconds
  categoryBreakdown: Record<string, { correct: number; total: number }>;
}

export type ExamStatus = 'not_started' | 'in_progress' | 'reviewing' | 'completed';

export interface ExamState {
  status: ExamStatus;
  config: ExamConfig | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, ExamAnswer>;
  startTime: number | null;
  remainingTime: number; // seconds
}

// ==================== Practice ====================

export type PracticeMode = 
  | 'category'     // Practice by category
  | 'weakness'     // Practice weak areas
  | 'new'          // Practice new questions
  | 'review'       // Review due Leitner cards
  | 'all';         // All questions

export interface PracticeSession {
  mode: PracticeMode;
  category?: QuestionCategory;
  licenseType: LicenseType;
  questions: Question[];
  currentIndex: number;
  answeredCount: number;
  correctCount: number;
}

// ==================== User Progress ====================

export interface UserProgress {
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalWrong: number;
  studyTimeMinutes: number;
  streak: number; // consecutive days studied
  lastStudyDate: string | null;
  examsCompleted: number;
  examsPassed: number;
  averageExamScore: number;
  categoryStats: Record<string, CategoryStat>;
  leitnerCards: Record<string, LeitnerCard>;
  readinessScore: number; // 0-100
}

export interface CategoryStat {
  name: string;
  totalAnswered: number;
  correctAnswered: number;
  accuracy: number; // percentage
}

// ==================== Traffic Signs ====================

export type SignType = 
  | 'warning'       // אזהרה
  | 'regulatory'    // הוריה
  | 'prohibitory'   // איסור
  | 'mandatory'     // חובה
  | 'information'   // מידע
  | 'guidance';     // הנחיה

export interface TrafficSign {
  id: string;
  number: string; // Official sign number
  name: string;
  description: string;
  type: SignType;
  imageUrl: string;
  category: string;
}

// ==================== Theme ====================

export type ThemeMode = 'light' | 'dark';
export type Language = 'he' | 'ar' | 'en' | 'ru' | 'fr' | 'es';
export type Direction = 'rtl' | 'ltr';

export const LANGUAGE_DIRECTIONS: Record<Language, Direction> = {
  he: 'rtl',
  ar: 'rtl',
  en: 'ltr',
  ru: 'ltr',
  fr: 'ltr',
  es: 'ltr',
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  he: 'עברית',
  ar: 'العربية',
  en: 'English',
  ru: 'Русский',
  fr: 'Français',
  es: 'Español',
};

// ==================== Navigation ====================

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}
