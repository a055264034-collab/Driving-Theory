import { LicenseType, LeitnerCard } from '@/types';

export interface RecentQuestionRecord {
  questionId: string;
  questionText: string;
  category: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface UserStats {
  selectedLicense: LicenseType;
  studyStreak: number;
  lastStudyDate: string;
  totalAnswered: number;
  totalCorrect: number;
  totalStudyTimeSeconds: number;
  recentQuestions: RecentQuestionRecord[];
  examScoreHistory: number[]; // Array of past percentage scores, e.g. [65, 72, 80, 85]
  leitnerCards: Record<string, LeitnerCard>; // questionId -> LeitnerCard
  categoryStats: Record<string, { answered: number; correct: number }>;
}

const STORAGE_KEY = 'theory_master_user_stats_v2';

const DEFAULT_STATS: UserStats = {
  selectedLicense: 'B',
  studyStreak: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  totalAnswered: 0,
  totalCorrect: 0,
  totalStudyTimeSeconds: 0,
  recentQuestions: [],
  examScoreHistory: [],
  leitnerCards: {},
  categoryStats: {
    'חוקי התנועה': { answered: 0, correct: 0 },
    'תמרורים': { answered: 0, correct: 0 },
    'בטיחות': { answered: 0, correct: 0 },
    'הכרת הרכב': { answered: 0, correct: 0 },
  },
};

export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATS,
      ...parsed,
      recentQuestions: parsed.recentQuestions || [],
      examScoreHistory: parsed.examScoreHistory || [],
    };
  } catch (e) {
    console.error('Error loading stats:', e);
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving stats:', e);
  }
}

export function recordQuestionAnswer(
  questionId: string,
  category: string,
  isCorrect: boolean,
  questionText?: string,
  timeSpentSeconds: number = 15
): UserStats {
  const stats = getUserStats();
  stats.totalAnswered += 1;
  if (isCorrect) stats.totalCorrect += 1;
  stats.totalStudyTimeSeconds += timeSpentSeconds;

  // Add to recent questions (keep last 10)
  if (questionText) {
    stats.recentQuestions.unshift({
      questionId,
      questionText,
      category: category || 'כללי',
      isCorrect,
      answeredAt: new Date().toISOString(),
    });
    if (stats.recentQuestions.length > 10) {
      stats.recentQuestions = stats.recentQuestions.slice(0, 10);
    }
  }

  // Category stats
  const cat = category || 'חוקי התנועה';
  if (!stats.categoryStats[cat]) {
    stats.categoryStats[cat] = { answered: 0, correct: 0 };
  }
  stats.categoryStats[cat].answered += 1;
  if (isCorrect) stats.categoryStats[cat].correct += 1;

  // Leitner update
  const now = new Date();
  const existingCard = stats.leitnerCards[questionId] || {
    questionId,
    box: 1,
    lastReviewed: now.toISOString(),
    nextReview: now.toISOString(),
    correctStreak: 0,
    totalAttempts: 0,
    correctAttempts: 0,
  };

  existingCard.totalAttempts += 1;
  existingCard.lastReviewed = now.toISOString();

  if (isCorrect) {
    existingCard.correctAttempts += 1;
    existingCard.correctStreak += 1;
    if (existingCard.box < 5) {
      existingCard.box = (existingCard.box + 1) as any;
    }
  } else {
    existingCard.box = 1;
    existingCard.correctStreak = 0;
  }

  const intervals: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
  const daysToAdd = intervals[existingCard.box] || 1;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  existingCard.nextReview = nextDate.toISOString();

  stats.leitnerCards[questionId] = existingCard;

  // Streak update
  const today = now.toISOString().split('T')[0];
  if (stats.lastStudyDate !== today) {
    const lastDate = new Date(stats.lastStudyDate);
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      stats.studyStreak += 1;
    } else if (diffDays > 1) {
      stats.studyStreak = 1;
    }
    stats.lastStudyDate = today;
  }

  saveUserStats(stats);
  return stats;
}

export function recordExamCompleted(score: number, timeTakenSeconds: number): UserStats {
  const stats = getUserStats();
  stats.totalStudyTimeSeconds += timeTakenSeconds;
  stats.examScoreHistory.push(score);
  if (stats.examScoreHistory.length > 15) {
    stats.examScoreHistory = stats.examScoreHistory.slice(-15);
  }
  saveUserStats(stats);
  return stats;
}
