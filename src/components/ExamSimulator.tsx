'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  HelpCircle,
  RotateCcw,
  Sparkles,
  XCircle,
  Eye,
} from 'lucide-react';
import { Question, LicenseType } from '@/types';
import { recordQuestionAnswer } from '@/lib/storage';

interface ExamSimulatorProps {
  licenseType: LicenseType;
  onExit: () => void;
  onExamSaved?: () => void;
}

interface QuestionAnswerState {
  selectedIndex: number | null;
  flagged: boolean;
}

export default function ExamSimulator({ licenseType, onExit, onExamSaved }: ExamSimulatorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, QuestionAnswerState>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(40 * 60); // 40 minutes
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'errors' | 'correct'>('all');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch 30 random questions matching the license type
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      setLoading(true);
      try {
        const res = await fetch(`/api/questions?licenseType=${licenseType}&limit=30&random=true`);
        const data = await res.json();
        if (data.success && data.questions && isMounted) {
          setQuestions(data.questions);
          // Initialize empty answers state
          const initialMap: Record<number, QuestionAnswerState> = {};
          data.questions.forEach((_: any, idx: number) => {
            initialMap[idx] = { selectedIndex: null, flagged: false };
          });
          setAnswers(initialMap);
        }
      } catch (e) {
        console.error('Failed to load exam questions:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [licenseType]);

  // Countdown timer
  useEffect(() => {
    if (loading || isFinished) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isFinished]);

  // Handle select answer
  const handleSelectOption = (optionIndex: number) => {
    if (isFinished) return;
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        selectedIndex: optionIndex,
      },
    }));
  };

  // Toggle flag
  const toggleFlag = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: {
        ...prev[currentIndex],
        flagged: !prev[currentIndex]?.flagged,
      },
    }));
  };

  // Submit and calculate results
  const finishExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsFinished(true);
    setShowSubmitModal(false);

    // Calculate score & answers
    let correct = 0;
    let wrong = 0;
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {};
    const recordedAnswers: any[] = [];

    questions.forEach((q, idx) => {
      const userChoice = answers[idx]?.selectedIndex;
      const isCorrect = userChoice === q.correctAnswerIndex;

      if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }

      // Record to user's Leitner stats
      recordQuestionAnswer(q.id, q.category, isCorrect);

      // Category breakdown
      const cat = q.category || 'כללי';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { correct: 0, total: 0 };
      }
      categoryBreakdown[cat].total += 1;
      if (isCorrect) categoryBreakdown[cat].correct += 1;

      recordedAnswers.push({
        questionId: q.id,
        questionNumber: q.questionNumber,
        questionText: q.text,
        selectedAnswerIndex: userChoice !== undefined ? userChoice : null,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        answersList: q.answers,
        category: q.category,
      });
    });

    const passed = wrong <= 4;
    const score = Math.round((correct / questions.length) * 100);
    const timeTaken = 40 * 60 - remainingSeconds;

    // Trigger confetti celebration on passing!
    if (passed) {
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }

    // Save exam attempt to backend API
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseType,
          totalQuestions: questions.length,
          correctAnswers: correct,
          wrongAnswers: wrong,
          score,
          passed,
          timeTaken,
          answers: recordedAnswers,
          categoryBreakdown,
        }),
      });
      if (onExamSaved) onExamSaved();
    } catch (e) {
      console.error('Error saving exam history:', e);
    }
  };

  // Format time mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-slate-300 font-medium">טוען מבחן ממאגר משרד התחבורה...</div>
        <div className="text-xs text-slate-500">נבחרות 30 שאלות רשמיות לדרגה {licenseType}</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl glass-panel border border-slate-800">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">לא נמצאו שאלות למבחן</h3>
        <p className="text-xs text-slate-400 mb-6">
          אנא ודא כי קובץ השאלות סונכרן בהצלחה או לחץ על כפתור הסנכרון בתפריט העליון.
        </p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
        >
          חזור ללוח הבקרה
        </button>
      </div>
    );
  }

  // Calculate review stats
  const answeredCount = Object.values(answers).filter((a) => a.selectedIndex !== null).length;
  const flaggedCount = Object.values(answers).filter((a) => a.flagged).length;
  const currentQ = questions[currentIndex];
  const currentAnswer = answers[currentIndex] || { selectedIndex: null, flagged: false };

  // ==================== RESULTS SCREEN ====================
  if (isFinished) {
    const correctCount = questions.filter(
      (q, idx) => answers[idx]?.selectedIndex === q.correctAnswerIndex
    ).length;
    const wrongCount = questions.length - correctCount;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = wrongCount <= 4;
    const timeSpent = 40 * 60 - remainingSeconds;

    const filteredQuestions = questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q, idx }) => {
        const isCorrect = answers[idx]?.selectedIndex === q.correctAnswerIndex;
        if (reviewFilter === 'errors') return !isCorrect;
        if (reviewFilter === 'correct') return isCorrect;
        return true;
      });

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Result Header Card */}
        <div
          className={`rounded-3xl glass-panel p-6 sm:p-10 border text-center relative overflow-hidden ${
            passed
              ? 'border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-emerald-950/30'
              : 'border-red-500/40 bg-gradient-to-b from-slate-900/90 to-red-950/30'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-xl ${
                passed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
            >
              {passed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
              {passed ? 'כל הכבוד! עברת את המבחן בהצלחה! 🎉' : 'לא עברת את המבחן הפעם 😔'}
            </h2>
            <p className="text-sm text-slate-300 max-w-lg mb-8">
              {passed
                ? 'הפגנת ידע מצוין בתקנות התעבורה, תמרורים ובטיחות. אתה מוכן לגשת למבחן האמיתי!'
                : 'מותר לטעות בעד 4 שאלות מתוך 30. עבור על השאלות שטעית בהן ותרגל שוב בכרטיסיות לייטנר.'}
            </p>

            {/* Quick Score Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mb-8">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">ציון סופי</div>
                <div
                  className={`text-3xl font-extrabold ${
                    passed ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {score}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">תשובות נכונות</div>
                <div className="text-3xl font-extrabold text-white">
                  {correctCount} <span className="text-xs font-normal text-slate-400">/ 30</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">שגיאות (עד 4)</div>
                <div
                  className={`text-3xl font-extrabold ${
                    wrongCount <= 4 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {wrongCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <div className="text-xs text-slate-400 mb-1">משך המבחן</div>
                <div className="text-3xl font-extrabold text-white">
                  {Math.round(timeSpent / 60)} <span className="text-xs font-normal text-slate-400">דק&apos;</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  setIsFinished(false);
                  setCurrentIndex(0);
                  setRemainingSeconds(40 * 60);
                  const resetMap: Record<number, QuestionAnswerState> = {};
                  questions.forEach((_, idx) => {
                    resetMap[idx] = { selectedIndex: null, flagged: false };
                  });
                  setAnswers(resetMap);
                }}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>מבחן סימולציה חדש</span>
              </button>

              <button
                onClick={onExit}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
              >
                חזור ללוח הבקרה
              </button>
            </div>
          </div>
        </div>

        {/* Review Questions Section */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">סקירת שאלות המבחן</h3>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                כל השאלות (30)
              </button>
              <button
                onClick={() => setReviewFilter('errors')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'errors'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                שגיאות בלבד ({wrongCount})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  reviewFilter === 'correct'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                נכונות ({correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {filteredQuestions.map(({ q, idx }) => {
              const userChoice = answers[idx]?.selectedIndex;
              const isCorrect = userChoice === q.correctAnswerIndex;

              return (
                <div
                  key={q.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-slate-900/50 border-emerald-500/30'
                      : 'bg-red-950/10 border-red-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                        שאלה #{idx + 1}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        {q.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> נכון
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> שגוי
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-base font-semibold text-white mb-4 leading-relaxed">{q.text}</p>

                  {/* Question image */}
                  {q.imageUrl && (
                    <div className="mb-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={q.imageUrl}
                        alt="תמונת שאלה"
                        className="max-h-48 rounded-xl border border-slate-700 bg-white p-2 object-contain"
                      />
                    </div>
                  )}

                  {/* Answers review list */}
                  <div className="space-y-2">
                    {q.answers.map((ans, optIdx) => {
                      const isOptionCorrect = optIdx === q.correctAnswerIndex;
                      const isOptionChosen = optIdx === userChoice;

                      let rowStyle = 'bg-slate-900/60 border-slate-800 text-slate-300';
                      if (isOptionCorrect) {
                        rowStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold';
                      } else if (isOptionChosen && !isOptionCorrect) {
                        rowStyle = 'bg-red-950/40 border-red-500/60 text-red-200 line-through';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${rowStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {optIdx + 1}
                            </span>
                            <span>{ans}</span>
                          </div>

                          {isOptionCorrect && (
                            <span className="text-xs text-emerald-400 font-bold shrink-0">
                              תשובה נכונה ✓
                            </span>
                          )}
                          {isOptionChosen && !isOptionCorrect && (
                            <span className="text-xs text-red-400 font-bold shrink-0">
                              הבחירה שלך ✗
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== ACTIVE TEST VIEW ====================
  const isTimeCritical = remainingSeconds < 5 * 60; // under 5 minutes

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Test Control Bar */}
      <div className="rounded-2xl glass-panel p-3 sm:p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
        {/* Exam Title & License */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
            דרגה {licenseType}
          </span>
          <span className="text-xs sm:text-sm font-bold text-white">סימולציית מבחן תאוריה רשמי</span>
        </div>

        {/* Question Counter & Status */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-300">
          <span>
            נענו: <strong className="text-white">{answeredCount}</strong> / 30
          </span>
          {flaggedCount > 0 && (
            <span className="text-amber-400 font-medium">
              מסומנות: <strong>{flaggedCount}</strong>
            </span>
          )}
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm ${
              isTimeCritical
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            סיים והגש מבחן
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-8 border border-slate-800 shadow-2xl relative">
        {/* Question Metadata Header */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-800/80 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-xs sm:text-sm font-black text-cyan-400 bg-cyan-500/10 px-2.5 sm:px-3 py-1 rounded-xl border border-cyan-500/20">
              שאלה {currentIndex + 1} מתוך 30
            </span>
            <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-slate-800/80 text-slate-300">
              {currentQ.category}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500">מס&apos; ש&apos; {currentQ.questionNumber}</span>
          </div>

          <button
            onClick={toggleFlag}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-medium border transition-all ${
              currentAnswer.flagged
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${currentAnswer.flagged ? 'fill-amber-400' : ''}`} />
            <span>{currentAnswer.flagged ? 'מסומנת לעיון' : 'סמן לעיון'}</span>
          </button>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-bold text-white mb-6 leading-relaxed">
          {currentQ.text}
        </h2>

        {/* Image Display if question has image */}
        {currentQ.imageUrl && (
          <div className="mb-6 flex justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-700 max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentQ.imageUrl}
                alt="תמונת שאלה ממשרד התחבורה"
                className="max-h-56 w-auto object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-3 mb-8">
          {currentQ.answers.map((answerText, optIdx) => {
            const isSelected = currentAnswer.selectedIndex === optIdx;

            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {optIdx + 1}
                  </div>
                  <span className="text-sm sm:text-base leading-relaxed">{answerText}</span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
                  }`}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
            <span>שאלה קודמת</span>
          </button>

          <span className="text-xs text-slate-400">
            {currentAnswer.selectedIndex !== null ? (
              <span className="text-emerald-400 font-medium">✓ תשובה נשמרה</span>
            ) : (
              <span className="text-slate-500">טרם נבחרה תשובה</span>
            )}
          </span>

          <button
            onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
            disabled={currentIndex === questions.length - 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              currentIndex === questions.length - 1
                ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20'
            }`}
          >
            <span>שאלה הבאה</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 30-Question Grid Palette */}
      <div className="rounded-2xl glass-panel p-4 border border-slate-800">
        <div className="text-xs font-bold text-slate-400 mb-3 flex items-center justify-between">
          <span>מפת שאלות (30 שאלות)</span>
          <div className="flex items-center gap-3 text-[11px] font-normal">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> נענתה
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> מסומנת
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-600" /> טרם
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
          {questions.map((_, idx) => {
            const isCurrent = idx === currentIndex;
            const ansState = answers[idx];
            const isAnswered = ansState?.selectedIndex !== null;
            const isFlagged = ansState?.flagged;

            let btnClass = 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600';
            if (isAnswered) {
              btnClass = 'bg-blue-600/30 border-blue-500/60 text-blue-300 font-bold';
            }
            if (isCurrent) {
              btnClass = 'ring-2 ring-cyan-400 border-cyan-400 text-white font-black bg-cyan-950/40';
            }

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-9 rounded-xl border text-xs flex items-center justify-center transition-all ${btnClass}`}
              >
                <span>{idx + 1}</span>
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl glass-panel p-6 border border-slate-700 bg-slate-900 text-right shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">האם ברצונך להגיש את המבחן?</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              ענית על <strong className="text-white">{answeredCount}</strong> מתוך{' '}
              <strong className="text-white">30</strong> שאלות.
              {answeredCount < 30 && (
                <span className="block mt-2 text-amber-400 font-semibold">
                  שים לב: ישנן {30 - answeredCount} שאלות שטרם נענו, והן ייחשבו כשגויות.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                המשך במבחן
              </button>
              <button
                onClick={finishExam}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
              >
                אישור והגשת מבחן
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
