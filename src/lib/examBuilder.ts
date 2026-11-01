/**
 * Exam Builder
 * 
 * Creates a simulated driving theory exam following
 * the official Israeli Ministry of Transport rules.
 * 
 * For each exam:
 * - 30 questions selected by weighted random
 * - Questions distributed across categories
 * - Filtered by license type
 * - No repeat questions from recent exams
 */

import type { Question, LicenseType, ExamConfig, EXAM_CONFIGS } from '@/types';

interface ExamBuilderOptions {
  questions: Question[];
  licenseType: LicenseType;
  config: ExamConfig;
  excludeQuestionIds?: string[]; // Questions from recent exams
}

/**
 * Category distribution targets for a 30-question exam
 * Based on typical Israeli theory exam distribution
 */
const CATEGORY_DISTRIBUTION: Record<string, number> = {
  'חוקי התנועה': 12,     // ~40%
  'תמרורים': 8,          // ~27%
  'בטיחות בדרכים': 5,    // ~17%
  'הכרת הרכב': 3,        // ~10%
  'נהיגה נכונה': 2,      // ~6%
};

/**
 * Build a complete exam with properly distributed questions
 */
export function buildExam(options: ExamBuilderOptions): Question[] {
  const { questions, licenseType, config, excludeQuestionIds = [] } = options;

  // Filter questions by license type
  const eligibleQuestions = questions.filter(q => 
    q.licenseTypes.includes(licenseType) &&
    !excludeQuestionIds.includes(q.id)
  );

  if (eligibleQuestions.length < config.totalQuestions) {
    // If not enough questions after filtering, relax exclusion
    const allEligible = questions.filter(q => q.licenseTypes.includes(licenseType));
    return selectQuestions(allEligible, config.totalQuestions);
  }

  return selectQuestions(eligibleQuestions, config.totalQuestions);
}

/**
 * Select questions with proper category distribution
 */
function selectQuestions(pool: Question[], count: number): Question[] {
  const selected: Question[] = [];
  const usedIds = new Set<string>();

  // Group questions by category
  const byCategory = new Map<string, Question[]>();
  for (const q of pool) {
    const cat = q.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(q);
  }

  // Fill each category according to distribution
  for (const [category, targetCount] of Object.entries(CATEGORY_DISTRIBUTION)) {
    const categoryQuestions = byCategory.get(category) || [];
    const available = categoryQuestions.filter(q => !usedIds.has(q.id));
    const toSelect = Math.min(targetCount, available.length);
    
    const shuffled = shuffleArray([...available]);
    for (let i = 0; i < toSelect; i++) {
      selected.push(shuffled[i]);
      usedIds.add(shuffled[i].id);
    }
  }

  // Fill remaining spots with random questions from any category
  if (selected.length < count) {
    const remaining = pool.filter(q => !usedIds.has(q.id));
    const shuffled = shuffleArray([...remaining]);
    const needed = count - selected.length;
    
    for (let i = 0; i < Math.min(needed, shuffled.length); i++) {
      selected.push(shuffled[i]);
      usedIds.add(shuffled[i].id);
    }
  }

  // Final shuffle to mix categories
  return shuffleArray(selected);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculate exam score and determine pass/fail
 */
export function calculateExamScore(
  totalQuestions: number,
  correctAnswers: number,
  maxErrors: number
): { score: number; passed: boolean } {
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const errors = totalQuestions - correctAnswers;
  const passed = errors <= maxErrors;
  
  return { score, passed };
}

/**
 * Format time remaining as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
