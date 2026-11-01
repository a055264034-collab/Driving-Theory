/**
 * Leitner Spaced Repetition Algorithm
 * 
 * Implements the Leitner system with 5 boxes:
 * Box 1: New/Wrong questions → Review every 1 day
 * Box 2: Correct once → Review every 2 days
 * Box 3: Correct twice → Review every 4 days
 * Box 4: Correct 3 times → Review every 8 days
 * Box 5: Mastered → Review every 16 days
 */

import { LeitnerBox, LeitnerCard, LEITNER_INTERVALS } from '@/types';

/**
 * Create a new Leitner card for a question
 */
export function createLeitnerCard(questionId: string): LeitnerCard {
  const now = new Date().toISOString();
  return {
    questionId,
    box: 1,
    lastReviewed: now,
    nextReview: now, // Due immediately
    correctStreak: 0,
    totalAttempts: 0,
    correctAttempts: 0,
  };
}

/**
 * Move a card up or down based on answer correctness
 */
export function updateLeitnerCard(card: LeitnerCard, isCorrect: boolean): LeitnerCard {
  const now = new Date();
  const nowISO = now.toISOString();

  if (isCorrect) {
    // Move up one box (max 5)
    const newBox = Math.min(card.box + 1, 5) as LeitnerBox;
    const intervalDays = LEITNER_INTERVALS[newBox];
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    return {
      ...card,
      box: newBox,
      lastReviewed: nowISO,
      nextReview: nextReview.toISOString(),
      correctStreak: card.correctStreak + 1,
      totalAttempts: card.totalAttempts + 1,
      correctAttempts: card.correctAttempts + 1,
    };
  } else {
    // Move back to box 1
    const nextReview = new Date(now.getTime() + LEITNER_INTERVALS[1] * 24 * 60 * 60 * 1000);

    return {
      ...card,
      box: 1,
      lastReviewed: nowISO,
      nextReview: nextReview.toISOString(),
      correctStreak: 0,
      totalAttempts: card.totalAttempts + 1,
    };
  }
}

/**
 * Check if a card is due for review
 */
export function isDue(card: LeitnerCard): boolean {
  return new Date(card.nextReview) <= new Date();
}

/**
 * Get all due cards, sorted by priority (box 1 first, then by overdue time)
 */
export function getDueCards(cards: Record<string, LeitnerCard>): LeitnerCard[] {
  const now = new Date();
  
  return Object.values(cards)
    .filter(card => isDue(card))
    .sort((a, b) => {
      // Lower box = higher priority
      if (a.box !== b.box) return a.box - b.box;
      // More overdue = higher priority
      return new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime();
    });
}

/**
 * Get cards that need immediate attention (box 1 or very overdue)
 */
export function getUrgentCards(cards: Record<string, LeitnerCard>): LeitnerCard[] {
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return Object.values(cards)
    .filter(card => {
      if (card.box === 1) return true;
      const overdue = now.getTime() - new Date(card.nextReview).getTime();
      return overdue > oneDayMs * 2; // More than 2 days overdue
    })
    .sort((a, b) => a.box - b.box);
}

/**
 * Calculate the distribution of cards across boxes
 */
export function getBoxDistribution(cards: Record<string, LeitnerCard>): Record<LeitnerBox, number> {
  const distribution: Record<LeitnerBox, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  for (const card of Object.values(cards)) {
    distribution[card.box]++;
  }
  
  return distribution;
}

/**
 * Get the total number of mastered questions (box 5)
 */
export function getMasteredCount(cards: Record<string, LeitnerCard>): number {
  return Object.values(cards).filter(card => card.box === 5).length;
}

/**
 * Get accuracy percentage for all attempted cards
 */
export function getOverallAccuracy(cards: Record<string, LeitnerCard>): number {
  let totalAttempts = 0;
  let totalCorrect = 0;
  
  for (const card of Object.values(cards)) {
    totalAttempts += card.totalAttempts;
    totalCorrect += card.correctAttempts;
  }
  
  if (totalAttempts === 0) return 0;
  return Math.round((totalCorrect / totalAttempts) * 100);
}
