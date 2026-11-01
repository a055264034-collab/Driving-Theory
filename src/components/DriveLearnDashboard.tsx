'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Globe,
  ChevronDown,
  Play,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  Clock,
  Star,
  Check,
  X,
  RotateCw,
  Sparkles,
  BookOpen,
  Target,
} from 'lucide-react';
import { UserStats, recordQuestionAnswer } from '@/lib/storage';
import { LicenseType, Question } from '@/types';

interface DriveLearnDashboardProps {
  stats: UserStats;
  selectedLicense: LicenseType;
  onStartExam: () => void;
  onStartPractice: () => void;
  onStartSigns: () => void;
  onStartCategoryPractice: (category: string) => void;
  onStatsUpdated: () => void;
}

export default function DriveLearnDashboard({
  stats,
  selectedLicense,
  onStartExam,
  onStartPractice,
  onStartSigns,
  onStartCategoryPractice,
  onStatsUpdated,
}: DriveLearnDashboardProps) {
  // Live Sign Question state
  const [currentSignQ, setCurrentSignQ] = useState<Question | null>(null);
  const [selectedSignAnswer, setSelectedSignAnswer] = useState<number | null>(null);
  const [signAnswered, setSignAnswered] = useState<boolean>(false);
  const [loadingSign, setLoadingSign] = useState<boolean>(false);

  // Topic Selection Modal
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);

  // Fetch a real official sign question from the database
  const loadRandomSignQuestion = async () => {
    setLoadingSign(true);
    setSelectedSignAnswer(null);
    setSignAnswered(false);
    try {
      const res = await fetch('/api/questions?category=תמרורים&limit=10&random=true');
      const data = await res.json();
      if (data.success && data.questions && data.questions.length > 0) {
        const withImg = data.questions.find((q: Question) => q.imageUrl) || data.questions[0];
        setCurrentSignQ(withImg);
      }
    } catch (e) {
      console.error('Failed to load random sign question:', e);
    } finally {
      setLoadingSign(false);
    }
  };

  useEffect(() => {
    loadRandomSignQuestion();
  }, []);

  const handleAnswerSign = (idx: number) => {
    if (!currentSignQ || signAnswered) return;
    setSelectedSignAnswer(idx);
    setSignAnswered(true);

    const isCorrect = idx === currentSignQ.correctAnswerIndex;
    recordQuestionAnswer(currentSignQ.id, 'תמרורים', isCorrect, currentSignQ.text, 20);
    onStatsUpdated();
  };

  const totalQuestionsInGov = 1802;
  const answered = stats.totalAnswered;
  const accuracy = answered > 0 ? Math.round((stats.totalCorrect / answered) * 100) : 0;
  const streak = stats.studyStreak || 1;

  const totalSeconds = stats.totalStudyTimeSeconds || answered * 25;
  const studyMinutes = Math.floor(totalSeconds / 60);
  const studyHours = Math.floor(studyMinutes / 60);
  const studyRemainingMins = studyMinutes % 60;
  const formattedStudyTime =
    studyHours > 0
      ? `${studyHours}:${studyRemainingMins.toString().padStart(2, '0')} שעות`
      : `${studyMinutes}:${(totalSeconds % 60).toString().padStart(2, '0')}`;

  const personalRating =
    answered > 0 ? Math.max(1.0, (accuracy / 100) * 4 + 1).toFixed(1) : '4.8';

  const scoreHistory =
    stats.examScoreHistory && stats.examScoreHistory.length > 0
      ? stats.examScoreHistory
      : [60, 68, 75, 82, Math.max(accuracy, 85)];

  const chartPoints = scoreHistory.map((score, i) => {
    const x = Math.round(15 + (i / Math.max(scoreHistory.length - 1, 1)) * 250);
    const y = Math.round(80 - (Math.min(Math.max(score, 20), 100) / 100) * 65);
    return { x, y, score };
  });

  const pathD = chartPoints.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = chartPoints[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} Q ${cpx} ${prev.y} ${pt.x} ${pt.y}`;
  }, '');

  const recentList =
    stats.recentQuestions && stats.recentQuestions.length > 0
      ? stats.recentQuestions.slice(0, 3)
      : [
          {
            questionId: 'default_1',
            questionText: 'מהי חובתך ברמזור אדום?',
            isCorrect: true,
            category: 'חוקי התנועה',
          },
          {
            questionId: 'default_2',
            questionText: 'מתי מותר לעקוף רכב אחר?',
            isCorrect: false,
            category: 'חוקי התנועה',
          },
          {
            questionId: 'default_3',
            questionText: 'מה משמעות תמרור מעגל תנועה?',
            isCorrect: true,
            category: 'תמרורים',
          },
        ];

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 animate-in fade-in duration-300">
      {/* Top Controls: positioned on the TOP RIGHT of the page (hidden on mobile to prevent wasted space) */}
      <div className="hidden sm:flex items-center justify-end gap-2.5 sm:gap-3 pt-0.5" dir="ltr">
        <button
          onClick={loadRandomSignQuestion}
          title="רענן שאלה יומית"
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-xs border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingSign ? 'animate-spin text-blue-600' : ''}`} />
        </button>

        <button className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-xs border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-950 transition-colors">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white shadow-xs border border-slate-200/90 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>עברית</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* Hero Banner (Fully responsive on Mobile) */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 flex items-center min-h-[auto] sm:min-h-[300px]">
        {/* Scenic road background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero_road.jpg"
          alt="כביש נופי"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Soft light wash overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40 sm:to-transparent" />

        {/* Content Container (Mobile: Column, Desktop: Row) */}
        <div
          className="relative z-10 w-full p-4 sm:p-8 md:p-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-8"
          dir="ltr"
        >
          {/* Left Hero Text (aligned right for Hebrew) */}
          <div className="space-y-2 sm:space-y-3 max-w-lg text-right" dir="rtl">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0c1b33] tracking-tight">
              תיאוריה לנהיגה
            </h1>
            <p className="text-xs sm:text-base md:text-xl font-bold text-slate-700">
              בקלות, בכל מקום ובקצב שלך
            </p>

            <div className="pt-1.5 sm:pt-2 flex justify-start">
              <button
                onClick={onStartPractice}
                className="w-full sm:w-auto justify-center px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-[#1d68d8] hover:bg-[#1556b8] text-white font-bold text-xs sm:text-base flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <span>התחל לתרגל</span>
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
              </button>
            </div>
          </div>

          {/* Floating Progress Card */}
          <div
            className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-5 shadow-xl border border-white/90 flex items-center justify-between sm:justify-start gap-4 sm:gap-6 w-full md:w-auto sm:min-w-[310px]"
            dir="ltr"
          >
            {/* Circular Gauge */}
            <div className="relative w-18 h-18 sm:w-24 sm:h-24 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke="#1d68d8"
                  strokeWidth="8"
                  strokeDasharray={238}
                  strokeDashoffset={238 - (238 * (accuracy || 72)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-lg sm:text-2xl font-black text-[#0c1b33]">
                {accuracy > 0 ? `${accuracy}%` : '72%'}
              </div>
            </div>

            {/* Stats text */}
            <div className="space-y-1.5 sm:space-y-2.5 text-xs text-right flex-1 sm:flex-initial" dir="rtl">
              <div className="font-extrabold text-xs sm:text-sm text-[#0c1b33] mb-0.5">
                ההתקדמות שלך
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 font-semibold text-[11px] sm:text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1d68d8] shrink-0" />
                <span>
                  <strong className="text-slate-900">{answered > 0 ? answered : 720}</strong> מתוך{' '}
                  {totalQuestionsInGov}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 font-semibold text-[11px] sm:text-xs">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1d68d8] shrink-0" />
                <span>
                  <strong className="text-slate-900">{streak} ימים</strong> ברציפות
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Action Cards Grid (2x2 on Mobile, 4 in row on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4" dir="ltr">
        {/* Card 1: מבחנים מדומים */}
        <div
          onClick={onStartExam}
          className="cursor-pointer group rounded-2xl p-3.5 sm:p-6 border border-amber-200/70 bg-gradient-to-b from-[#fffaf0] to-[#fff3d4] shadow-xs hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center text-center justify-between min-h-[150px] sm:min-h-[190px] relative"
          dir="rtl"
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
            🏆
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-black text-slate-900 mb-0.5 sm:mb-1">
              מבחנים מדומים
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">
              בדוק את עצמך במבחן מלא
            </p>
          </div>
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Card 2: תרגול לפי נושאים */}
        <div
          onClick={() => setShowTopicModal(true)}
          className="cursor-pointer group rounded-2xl p-3.5 sm:p-6 border border-blue-200/70 bg-gradient-to-b from-[#f3f8ff] to-[#e6f1ff] shadow-xs hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center text-center justify-between min-h-[150px] sm:min-h-[190px] relative"
          dir="rtl"
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
            🎯
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-black text-slate-900 mb-0.5 sm:mb-1">
              תרגול לפי נושאים
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">בחר נושא ולתרגל</p>
          </div>
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Card 3: לימוד תמרורים */}
        <div
          onClick={onStartSigns}
          className="cursor-pointer group rounded-2xl p-3.5 sm:p-6 border border-purple-200/70 bg-gradient-to-b from-[#f8f4ff] to-[#eee4ff] shadow-xs hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center text-center justify-between min-h-[150px] sm:min-h-[190px] relative"
          dir="rtl"
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-10 sm:h-10">
              <path d="M 6 36 L 34 36 L 32 32 L 8 32 Z" fill="#ff7a00" />
              <path d="M 12 30 L 28 30 L 26 23 L 14 23 Z" fill="#ffffff" />
              <path d="M 14 23 L 26 23 L 24 16 L 16 16 Z" fill="#ff7a00" />
              <path d="M 16 16 L 24 16 L 22 9 L 18 9 Z" fill="#ffffff" />
              <path d="M 18 9 L 22 9 L 20 4 Z" fill="#ff7a00" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-black text-slate-900 mb-0.5 sm:mb-1">
              לימוד תמרורים
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">הכר את כל התמרורים</p>
          </div>
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Card 4: תרגול חופשי */}
        <div
          onClick={onStartPractice}
          className="cursor-pointer group rounded-2xl p-3.5 sm:p-6 border border-sky-200/70 bg-gradient-to-b from-[#f0f9ff] to-[#e0f2fe] shadow-xs hover:shadow-md transition-all hover:-translate-y-1 flex flex-col items-center text-center justify-between min-h-[150px] sm:min-h-[190px] relative"
          dir="rtl"
        >
          <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-2xl sm:text-3xl mb-1 group-hover:scale-110 transition-transform">
            📋
          </div>
          <div>
            <h3 className="text-xs sm:text-base font-black text-slate-900 mb-0.5 sm:mb-1">
              תרגול חופשי
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">שאלות מכל הנושאים</p>
          </div>
          <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Cards (Stack on Mobile, 3 in row on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5" dir="ltr">
        {/* Card 1: הסטטיסטיקה שלי */}
        <div
          className="rounded-2xl bg-[#0c1b33] text-white p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col justify-between min-h-[260px] sm:min-h-[290px]"
          dir="rtl"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-white">הסטטיסטיקה שלי</h3>
              <span className="text-base">📊</span>
            </div>

            <div className="h-24 sm:h-28 w-full my-1 sm:my-2 flex items-center justify-center relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 280 90">
                <line x1="0" y1="20" x2="280" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="280" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="280" y2="80" stroke="#1e293b" strokeDasharray="3 3" />

                <path
                  d={pathD}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {chartPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#38bdf8"
                    className="hover:scale-125 transition-transform cursor-pointer"
                  />
                ))}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 sm:pt-4 border-t border-slate-800 text-center">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs mb-0.5 sm:mb-1 font-bold">
                ✓
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white">
                {accuracy > 0 ? `${accuracy}%` : '85%'}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400">תשובות נכונות</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs mb-0.5 sm:mb-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white">
                {formattedStudyTime}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400">זמן לימוד כולל</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs mb-0.5 sm:mb-1">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
              </div>
              <div className="text-sm sm:text-base font-extrabold text-white">
                {personalRating}
              </div>
              <div className="text-[9px] sm:text-[10px] text-slate-400">דירוג אישי</div>
            </div>
          </div>
        </div>

        {/* Card 2: השאלות האחרונות */}
        <div
          className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between min-h-[260px] sm:min-h-[290px]"
          dir="rtl"
        >
          <div>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#1d68d8]" />
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                השאלות האחרונות
              </h3>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {recentList.map((q, idx) => (
                <div
                  key={idx}
                  onClick={onStartPractice}
                  className="cursor-pointer flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs shrink-0 ${
                        q.isCorrect
                          ? 'bg-emerald-100 text-emerald-600 font-bold'
                          : 'bg-red-100 text-red-600 font-bold'
                      }`}
                    >
                      {q.isCorrect ? '✓' : '✗'}
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-800 truncate">
                      {q.questionText}
                    </span>
                  </div>

                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-xs flex items-center justify-center text-slate-400 shrink-0">
                    <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onStartPractice}
            className="w-full mt-3 sm:mt-4 py-2 sm:py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1d68d8] font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            <span>לצפייה בכל השאלות</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: מה משמעות התמרור הזה? */}
        <div
          className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between overflow-hidden min-h-[260px] sm:min-h-[290px]"
          dir="rtl"
        >
          <div>
            <div className="rounded-xl overflow-hidden mb-2.5 sm:mb-3 border border-slate-200 h-28 sm:h-32 relative bg-slate-50 flex items-center justify-center p-2">
              {loadingSign ? (
                <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              ) : currentSignQ?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentSignQ.imageUrl}
                  alt="תמרור רשמי"
                  className="max-h-24 sm:max-h-28 w-auto object-contain mx-auto"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/roundabout.jpg"
                  alt="מעגל תנועה"
                  className="w-full h-full object-cover object-center"
                />
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex-1 pl-2">
                {currentSignQ?.text || 'מה משמעות התמרור הזה?'}
              </h4>
              <button
                onClick={loadRandomSignQuestion}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 shrink-0 font-medium"
              >
                תמרור אחר ❯
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(
                currentSignQ?.answers || [
                  'מעגל תנועה',
                  'עצור',
                  'תן זכות קדימה',
                  'דרך ללא מוצא',
                ]
              ).map((ansText, optIdx) => {
                const isSelected = selectedSignAnswer === optIdx;
                const isCorrect =
                  currentSignQ ? optIdx === currentSignQ.correctAnswerIndex : optIdx === 0;

                let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                if (signAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-[#1d68d8] border-[#1d68d8] text-white shadow-sm font-bold';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-red-500 border-red-500 text-white font-bold';
                  } else {
                    btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-[#1d68d8] border-[#1d68d8] text-white shadow-sm font-bold';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswerSign(optIdx)}
                    className={`py-2.5 px-3 rounded-xl border text-right transition-all font-medium leading-snug flex items-center gap-2 ${btnStyle}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold shrink-0">
                      {optIdx + 1}
                    </span>
                    <span className="truncate">{ansText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Topics Selection Modal */}
      {showTopicModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  בחר נושא מתוך מאגר משרד התחבורה
                </h3>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                ✕ סגור
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
              {[
                { name: 'חוקי התנועה', count: 901, color: 'bg-blue-50 border-blue-200 text-blue-700', icon: '🚗' },
                { name: 'תמרורים', count: 391, color: 'bg-purple-50 border-purple-200 text-purple-700', icon: '🗼' },
                { name: 'בטיחות', count: 400, color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: '🛡️' },
                { name: 'הכרת הרכב', count: 110, color: 'bg-amber-50 border-amber-200 text-amber-700', icon: '🔧' },
              ].map((topic) => (
                <div
                  key={topic.name}
                  onClick={() => {
                    setShowTopicModal(false);
                    onStartCategoryPractice(topic.name);
                  }}
                  className={`p-3.5 sm:p-4 rounded-xl border cursor-pointer hover:scale-[1.02] transition-transform ${topic.color}`}
                >
                  <div className="text-xl sm:text-2xl mb-1.5">{topic.icon}</div>
                  <div className="font-extrabold text-xs sm:text-sm">{topic.name}</div>
                  <div className="text-[10px] sm:text-xs opacity-75 mt-0.5">
                    {topic.count} שאלות רשמיות
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowTopicModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
