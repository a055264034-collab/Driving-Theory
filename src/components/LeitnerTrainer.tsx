'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  HelpCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Question, LicenseType, LeitnerBox } from '@/types';
import { getUserStats, recordQuestionAnswer, UserStats } from '@/lib/storage';

interface LeitnerTrainerProps {
  licenseType: LicenseType;
  onExit: () => void;
  onStatsUpdated: () => void;
  filterCategory?: string;
}

export default function LeitnerTrainer({
  licenseType,
  onExit,
  onStatsUpdated,
  filterCategory,
}: LeitnerTrainerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);
  const [sessionTotal, setSessionTotal] = useState<number>(0);
  const [userStats, setUserStats] = useState<UserStats>(getUserStats());

  useEffect(() => {
    let isMounted = true;
    async function fetchCards() {
      setLoading(true);
      try {
        const catQuery = filterCategory ? `&category=${encodeURIComponent(filterCategory)}` : '';
        const res = await fetch(`/api/questions?licenseType=${licenseType}${catQuery}&limit=50&random=true`);
        const data = await res.json();
        if (data.success && isMounted) {
          setQuestions(data.questions || []);
        }
      } catch (e) {
        console.error('Error fetching questions for Leitner:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCards();
    return () => {
      isMounted = false;
    };
  }, [licenseType, filterCategory]);

  const currentQ = questions[currentIndex];
  const cardData = currentQ ? userStats.leitnerCards[currentQ.id] : null;
  const currentBox: LeitnerBox = (cardData?.box as LeitnerBox) || 1;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctAnswerIndex;
    if (isCorrect) setSessionCorrect((prev) => prev + 1);
    setSessionTotal((prev) => prev + 1);

    // Record Leitner advance/reset
    const updatedStats = recordQuestionAnswer(currentQ.id, currentQ.category, isCorrect);
    setUserStats(updatedStats);
    onStatsUpdated();
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <div className="text-slate-300 font-medium">טוען כרטיסיות חכמות...</div>
      </div>
    );
  }

  if (!currentQ || questions.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl glass-panel border border-slate-800">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">אין כרטיסיות זמינות</h3>
        <p className="text-xs text-slate-400 mb-6">סנכרן את מאגר השאלות או בחר דרגת רישיון אחרת.</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs"
        >
          חזור ללוח הבקרה
        </button>
      </div>
    );
  }

  const isSessionFinished = currentIndex >= questions.length - 1 && isAnswered;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">אימון חזרות מרווחות (לייטנר)</h2>
            <div className="text-xs text-slate-400">
              כרטיסייה {currentIndex + 1} מתוך {questions.length}
            </div>
          </div>
        </div>

        {/* Box badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">קופסה נוכחית:</span>
          <span
            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
              currentBox === 5
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : currentBox >= 3
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-amber-500/20 border-amber-500 text-amber-400'
            }`}
          >
            קופסה {currentBox} / 5
          </span>
        </div>
      </div>

      {/* Main Flashcard Card */}
      <div className="rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 shadow-2xl relative">
        {/* Category & streak pill */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80 mb-4 sm:mb-6">
          <span className="text-xs px-2.5 sm:px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold">
            {currentQ.category}
          </span>
          {cardData && cardData.correctStreak > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-400 font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>רצף {cardData.correctStreak} הצלחות</span>
            </span>
          )}
        </div>

        {/* Question text */}
        <h3 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6 leading-relaxed">
          {currentQ.text}
        </h3>

        {/* Image if available */}
        {currentQ.imageUrl && (
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-700 max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentQ.imageUrl}
                alt="תמונה מצורפת לשאלה"
                className="max-h-52 w-auto object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Answers options */}
        <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
          {currentQ.answers.map((answerText, optIdx) => {
            const isChosen = selectedOption === optIdx;
            const isCorrect = optIdx === currentQ.correctAnswerIndex;

            let optionStyle =
              'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700';

            if (isAnswered) {
              if (isCorrect) {
                optionStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-lg shadow-emerald-500/10';
              } else if (isChosen && !isCorrect) {
                optionStyle = 'bg-red-950/60 border-red-500 text-red-200';
              } else {
                optionStyle = 'bg-slate-900/30 border-slate-800/60 text-slate-500 opacity-60';
              }
            }

            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`cursor-pointer p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between gap-3 sm:gap-4 ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                    {optIdx + 1}
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed">{answerText}</span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                )}
                {isAnswered && isChosen && !isCorrect && (
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Feedback explanation bar */}
        {isAnswered && (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in ${
              selectedOption === currentQ.correctAnswerIndex
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
              {selectedOption === currentQ.correctAnswerIndex ? (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>נכון מאוד! הכרטיסייה עלתה לקופסה {Math.min(currentBox + 1, 5)}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>טעות! השאלה חזרה לקופסה 1 לחזרה מחר</span>
                </>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold transition-all text-center shrink-0"
            >
              המשך לשאלה הבאה ←
            </button>
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <button
            onClick={onExit}
            className="text-slate-400 hover:text-white transition-colors"
          >
            חזור ללוח הבקרה
          </button>

          <div>
            דיוק באימון הנוכחי:{' '}
            <strong className="text-white">
              {sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0}%
            </strong>{' '}
            ({sessionCorrect}/{sessionTotal})
          </div>
        </div>
      </div>
    </div>
  );
}
