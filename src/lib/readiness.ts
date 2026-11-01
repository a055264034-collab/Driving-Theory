/**
 * Readiness Score Calculator
 * 
 * Calculates a 0-100% score predicting how ready the user is 
 * for the actual driving theory exam.
 * 
 * Formula:
 *   score = (mastered/total) × 0.4
 *         + (recent_accuracy) × 0.3
 *         + (avg_exam_score) × 0.2
 *         + (category_coverage) × 0.1
 */

import type { LeitnerCard, ExamResult, CategoryStat, QuestionCategory } from '@/types';
import { getMasteredCount } from './leitner';

const ALL_CATEGORIES: QuestionCategory[] = [
  'חוקי התנועה',
  'תמרורים',
  'בטיחות בדרכים',
  'הכרת הרכב',
  'נהיגה נכונה',
];

interface ReadinessInput {
  leitnerCards: Record<string, LeitnerCard>;
  totalQuestions: number;
  recentAttempts: { correct: number; total: number }; // Last 30 days
  examResults: ExamResult[];
  categoryStats: Record<string, CategoryStat>;
}

export interface ReadinessResult {
  score: number;           // 0-100
  level: ReadinessLevel;
  masteredRatio: number;   // 0-1
  recentAccuracy: number;  // 0-100
  avgExamScore: number;    // 0-100
  categoryCoverage: number; // 0-100
  recommendation: string;
}

export type ReadinessLevel = 
  | 'not_ready'    // 0-30
  | 'beginner'     // 31-50
  | 'improving'    // 51-70
  | 'almost_ready' // 71-85
  | 'ready'        // 86-100
  | 'expert';      // 95-100

const READINESS_THRESHOLDS: Record<ReadinessLevel, { min: number; max: number }> = {
  not_ready:    { min: 0, max: 30 },
  beginner:     { min: 31, max: 50 },
  improving:    { min: 51, max: 70 },
  almost_ready: { min: 71, max: 85 },
  ready:        { min: 86, max: 94 },
  expert:       { min: 95, max: 100 },
};

const READINESS_RECOMMENDATIONS: Record<ReadinessLevel, string> = {
  not_ready:    'התחל לתרגל שאלות יום-יומית. מומלץ להתמקד בקטגוריה אחת בכל פעם.',
  beginner:     'ממשיך טוב! התמקד בשאלות שטעית בהן ותרגל את נקודות החולשה.',
  improving:    'התקדמות יפה! נסה לעשות סימולציות מבחן ולשפר את הזמן.',
  almost_ready: 'כמעט שם! תרגל סימולציות מבחן וודא שאתה מכסה את כל הקטגוריות.',
  ready:        'מוכן למבחן! המשך לתרגל כדי לשמור על הרמה.',
  expert:       'מצוין! אתה מוכן לגמרי. בהצלחה במבחן! 🎉',
};

export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  const { leitnerCards, totalQuestions, recentAttempts, examResults, categoryStats } = input;

  // Component 1: Mastered ratio (weight: 0.4)
  const mastered = getMasteredCount(leitnerCards);
  const effectiveTotal = Math.max(totalQuestions, 1);
  const masteredRatio = Math.min(mastered / effectiveTotal, 1);
  const masteredScore = masteredRatio * 100;

  // Component 2: Recent accuracy (weight: 0.3)
  const recentAccuracy = recentAttempts.total > 0
    ? (recentAttempts.correct / recentAttempts.total) * 100
    : 0;

  // Component 3: Average exam score (weight: 0.2)
  const recentExams = examResults
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5); // Last 5 exams
  
  const avgExamScore = recentExams.length > 0
    ? recentExams.reduce((sum, exam) => sum + exam.score, 0) / recentExams.length
    : 0;

  // Component 4: Category coverage (weight: 0.1)
  const coveredCategories = ALL_CATEGORIES.filter(cat => {
    const stat = categoryStats[cat];
    return stat && stat.totalAnswered >= 5 && stat.accuracy >= 50;
  });
  const categoryCoverage = (coveredCategories.length / ALL_CATEGORIES.length) * 100;

  // Final score
  const score = Math.round(
    masteredScore * 0.4 +
    recentAccuracy * 0.3 +
    avgExamScore * 0.2 +
    categoryCoverage * 0.1
  );

  const clampedScore = Math.max(0, Math.min(100, score));
  const level = getReadinessLevel(clampedScore);

  return {
    score: clampedScore,
    level,
    masteredRatio,
    recentAccuracy: Math.round(recentAccuracy),
    avgExamScore: Math.round(avgExamScore),
    categoryCoverage: Math.round(categoryCoverage),
    recommendation: READINESS_RECOMMENDATIONS[level],
  };
}

function getReadinessLevel(score: number): ReadinessLevel {
  if (score >= 95) return 'expert';
  if (score >= 86) return 'ready';
  if (score >= 71) return 'almost_ready';
  if (score >= 51) return 'improving';
  if (score >= 31) return 'beginner';
  return 'not_ready';
}

/**
 * Get color for readiness score display
 */
export function getReadinessColor(score: number): string {
  if (score >= 86) return '#10B981'; // Green
  if (score >= 71) return '#3B82F6'; // Blue
  if (score >= 51) return '#F59E0B'; // Amber
  if (score >= 31) return '#F97316'; // Orange
  return '#EF4444'; // Red
}
