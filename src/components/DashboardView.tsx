'use client';

import React from 'react';
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { UserStats } from '@/lib/storage';
import { LicenseType } from '@/types';

interface DashboardViewProps {
  stats: UserStats;
  selectedLicense: LicenseType;
  onStartExam: () => void;
  onStartLeitner: () => void;
  onStartSigns: () => void;
  onStartPracticeCategory?: (category: string) => void;
  recentExams: any[];
}

export default function DashboardView({
  stats,
  selectedLicense,
  onStartExam,
  onStartLeitner,
  onStartSigns,
  onStartPracticeCategory,
  recentExams,
}: DashboardViewProps) {
  // Calculate Leitner box counts
  const boxCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let dueTodayCount = 0;
  const now = new Date();

  Object.values(stats.leitnerCards || {}).forEach((card) => {
    boxCounts[card.box] = (boxCounts[card.box] || 0) + 1;
    if (new Date(card.nextReview) <= now) {
      dueTodayCount++;
    }
  });

  const totalStudied = Object.keys(stats.leitnerCards || {}).length;
  const masteredCount = boxCounts[5] || 0;

  // Calculate Readiness Score (0-100)
  const accuracy = stats.totalAnswered > 0 ? (stats.totalCorrect / stats.totalAnswered) : 0;
  const passedExamsCount = recentExams.filter((e) => e.passed).length;
  const examWeight = Math.min(recentExams.length * 10, 30);
  const examPassBonus = recentExams.length > 0 ? (passedExamsCount / recentExams.length) * 30 : 0;
  const masteryWeight = Math.min((masteredCount / 200) * 40, 40);

  let readinessScore = Math.round(
    accuracy * 30 + (recentExams.length > 0 ? examPassBonus : 0) + masteryWeight
  );
  if (readinessScore > 100) readinessScore = 100;

  // Readiness text & color
  let readinessColor = 'text-amber-400';
  let readinessBorder = 'border-amber-500';
  let readinessText = 'בשלבי למידה התחלתיים';
  if (readinessScore >= 85) {
    readinessColor = 'text-emerald-400';
    readinessBorder = 'border-emerald-500';
    readinessText = 'מוכן מעולה למבחן האמיתי!';
  } else if (readinessScore >= 60) {
    readinessColor = 'text-blue-400';
    readinessBorder = 'border-blue-500';
    readinessText = 'התקדמות מצוינת, המשך לתרגל';
  }

  const categories = [
    { name: 'חוקי התנועה', total: 901, color: 'from-blue-600 to-indigo-600' },
    { name: 'תמרורים', total: 391, color: 'from-amber-500 to-orange-600' },
    { name: 'בטיחות', total: 400, color: 'from-emerald-600 to-teal-600' },
    { name: 'הכרת הרכב', total: 110, color: 'from-purple-600 to-pink-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-700/60 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>מאגר רשמי עדכני משרד התחבורה • 1,802 שאלות</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              הכנה חכמה למבחן הנהיגה העיוני (תאוריה)
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              שיטת לייטנר לחזרות מרווחות, סימולציית מבחן מדויקת של משרד התחבורה ומדד מוכנות אישי
              שיבטיח שתעבור בטסט הראשון.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
              <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{stats.studyStreak}</div>
                <div className="text-xs text-slate-400">ימי רצף למידה</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-white">{stats.totalAnswered}</div>
                <div className="text-xs text-slate-400">שאלות שנענו</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Readiness Meter & Leitner Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readiness Meter Card */}
        <div className="rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">מדד מוכנות למבחן</h3>
              </div>
              <span className="text-xs text-slate-400">דרגה {selectedLicense}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              אלגוריתם המחשב את הסיכוי שלך לעבור את המבחן האמיתי בהתבסס על כרטיסיות ששלטת בהן,
              דיוק בתשובות ומבחני סימולציה.
            </p>

            {/* Circular Gauge Display */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Gauge Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#1e293b"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={427}
                    strokeDashoffset={427 - (427 * readinessScore) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className={`transition-all duration-1000 ease-out ${readinessColor}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {readinessScore}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">מוכנות לטסט</span>
                </div>
              </div>
              <div className={`mt-3 text-sm font-semibold ${readinessColor}`}>{readinessText}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>דיוק כללי: {stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0}%</span>
            <span>מבחנים שעברו: {passedExamsCount} מתוך {recentExams.length}</span>
          </div>
        </div>

        {/* Leitner Spaced Repetition 5-Box Matrix */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">שיטת לייטנר (חזרות מרווחות)</h3>
              </div>
              {dueTodayCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 animate-pulse">
                  {dueTodayCount} לחזרה היום
                </span>
              ) : (
                <span className="text-xs text-slate-400">מעודכן להיום ✓</span>
              )}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              השיטה המדעית היעילה ביותר לזיכרון לטווח ארוך: שאלות שטעית בהן חוזרות מחר, שאלות שידעת
              מתקדמות לקופסאות הבאות ומופיעות לעיתים רחוקות יותר עד לשליטה מוחלטת.
            </p>

            {/* 5 Boxes Visualization */}
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3 my-2">
              {[
                { box: 1, label: 'קופסה 1', desc: 'כל יום', count: boxCounts[1], color: 'border-red-500/40 bg-red-950/20 text-red-400' },
                { box: 2, label: 'קופסה 2', desc: 'כל יומיים', count: boxCounts[2], color: 'border-amber-500/40 bg-amber-950/20 text-amber-400' },
                { box: 3, label: 'קופסה 3', desc: 'כל 4 ימים', count: boxCounts[3], color: 'border-blue-500/40 bg-blue-950/20 text-blue-400' },
                { box: 4, label: 'קופסה 4', desc: 'כל 8 ימים', count: boxCounts[4], color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-400' },
                { box: 5, label: 'קופסה 5', desc: 'שליטה!', count: boxCounts[5], color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400' },
              ].map((item) => (
                <div
                  key={item.box}
                  className={`rounded-2xl p-3 sm:p-4 border flex flex-col items-center text-center transition-transform hover:scale-105 ${item.color}`}
                >
                  <span className="text-xs font-semibold opacity-90">{item.label}</span>
                  <span className="text-xl sm:text-2xl font-black my-1 text-white">{item.count}</span>
                  <span className="text-[10px] opacity-75">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              סה&quot;כ בכרטיסיות: <strong className="text-white">{totalStudied}</strong> | בשליטה מלאה:{' '}
              <strong className="text-emerald-400">{masteredCount}</strong>
            </span>
            <button
              onClick={onStartLeitner}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
            >
              <Brain className="w-4 h-4" />
              <span>התחל תרגול כרטיסיות</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launch Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Real Exam Simulator Card */}
        <div
          onClick={onStartExam}
          className="cursor-pointer group relative overflow-hidden rounded-3xl glass-panel p-6 border border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-slate-900/80 to-emerald-950/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-emerald-400" />
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              סימולציה מלאה
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">מבחן סימולציה רשמי</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            30 שאלות אקראיות, הגבלת 40 דקות, עד 4 שגיאות מותרות. בדיוק באותם תנאים וממשק כמו במבחן
            האמיתי של משרד התחבורה.
          </p>
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span>התחל מבחן עכשיו ←</span>
            <div className="flex items-center gap-1 text-slate-400 font-normal">
              <Clock className="w-3.5 h-3.5" />
              <span>40 דקות</span>
            </div>
          </div>
        </div>

        {/* Traffic Signs Catalog Card */}
        <div
          onClick={onStartSigns}
          className="cursor-pointer group relative overflow-hidden rounded-3xl glass-panel p-6 border border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-slate-900/80 to-amber-950/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              391 שאלות תמרורים
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">קטלוג ובחינת תמרורים</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            מאגר כל התמרורים בישראל: תמרורי אזהרה, הוריה, איסור, זכות קדימה ומודיעין כולל בחן את עצמך
            והסברים מפורטים.
          </p>
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>עיון בתמרורים ←</span>
            <span className="text-slate-400 font-normal">כולל חיפוש וסינון</span>
          </div>
        </div>

        {/* Weakness Practice Card */}
        <div
          onClick={onStartLeitner}
          className="cursor-pointer group relative overflow-hidden rounded-3xl glass-panel p-6 border border-purple-500/30 hover:border-purple-500/60 bg-gradient-to-b from-slate-900/80 to-purple-950/20 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-6 h-6" />
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
              חזרות ממוקדות
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">אימון טעויות וחיזוק</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            אלגוריתם הלייטנר מבודד שאלות שטעית בהן בעבר ומסדר אותן במחזור חזרות מהיר עד שתדע אותן
            בעל פה ללא היסוס.
          </p>
          <div className="flex items-center justify-between text-xs font-semibold text-purple-400">
            <span>תרגל כרטיסיות עכשיו ←</span>
            <span className="text-slate-400 font-normal">חיזוק נקודות תורפה</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">מאגר השאלות לפי נושאים</h3>
            <p className="text-xs text-slate-400 mt-1">
              חלוקה רשמית של 1,802 שאלות משרד התחבורה ל-4 נושאי המבחן
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const userCat = stats.categoryStats[cat.name] || { answered: 0, correct: 0 };
            const catAccuracy =
              userCat.answered > 0 ? Math.round((userCat.correct / userCat.answered) * 100) : 0;

            return (
              <div
                key={cat.name}
                onClick={() => onStartPracticeCategory && onStartPracticeCategory(cat.name)}
                className="cursor-pointer p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${cat.color} group-hover:scale-125 transition-transform`}
                  />
                  <span className="text-xs text-slate-400">{cat.total} שאלות</span>
                </div>
                <h4 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h4>
                <div className="text-xs text-slate-400 mb-3">
                  נענו: {userCat.answered} • דיוק: {catAccuracy}%
                </div>

                {/* Mini progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${cat.color} transition-all duration-500`}
                    style={{ width: `${Math.min((userCat.answered / cat.total) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Exams Preview */}
      {recentExams && recentExams.length > 0 && (
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">מבחני סימולציה אחרונים</h3>
            </div>
            <span className="text-xs text-slate-400">סך הכל נבחנו: {recentExams.length}</span>
          </div>

          <div className="space-y-3">
            {recentExams.slice(0, 3).map((exam, idx) => (
              <div
                key={exam.id || idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      exam.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {exam.passed ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      ציון: {exam.score}% ({exam.correctAnswers} / {exam.totalQuestions || 30} נכונות)
                    </div>
                    <div className="text-xs text-slate-400">
                      שגיאות: {exam.wrongAnswers} • זמן: {Math.round((exam.timeTaken || 0) / 60)} דקות •{' '}
                      {new Date(exam.createdAt).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </div>

                <div
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    exam.passed
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                  }`}
                >
                  {exam.passed ? 'עבר בהצלחה!' : 'נכשל'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
