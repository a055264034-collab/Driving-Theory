'use client';

import React, { useState } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  HelpCircle,
  History,
  RotateCcw,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface HistoryViewProps {
  exams: any[];
  onStartExam: () => void;
}

export default function HistoryView({ exams, onStartExam }: HistoryViewProps) {
  const [selectedExam, setSelectedExam] = useState<any | null>(null);

  const totalExams = exams.length;
  const passedExams = exams.filter((e) => e.passed).length;
  const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;
  const avgScore =
    totalExams > 0
      ? Math.round(exams.reduce((sum, e) => sum + (e.score || 0), 0) / totalExams)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-3xl glass-panel p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-black text-white">היסטוריית מבחנים וביצועים</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            מעקב אחר תוצאות המבחנים, אחוזי המעבר ומגמת השיפור לאורך זמן.
          </p>
        </div>

        <button
          onClick={onStartExam}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
        >
          <FileCheck2 className="w-4 h-4" />
          <span>בצע מבחן סימולציה חדש</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">מבחנים שבוצעו</div>
          <div className="text-3xl font-extrabold text-white">{totalExams}</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">אחוז מעבר</div>
          <div
            className={`text-3xl font-extrabold ${
              passRate >= 70 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {passRate}%
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">ציון ממוצע</div>
          <div className="text-3xl font-extrabold text-cyan-400">{avgScore}%</div>
        </div>

        <div className="p-5 rounded-2xl glass-panel border border-slate-800 text-center">
          <div className="text-xs text-slate-400 mb-1">מבחנים שעברו</div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {passedExams} <span className="text-xs font-normal text-slate-400">/ {totalExams}</span>
          </div>
        </div>
      </div>

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-slate-800">
          <FileCheck2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">טרם ביצעת מבחני סימולציה</h3>
          <p className="text-xs text-slate-400 mb-6">
            בצע את מבחן הסימולציה הראשון שלך כדי לראות כאן את הניתוח המפורט.
          </p>
          <button
            onClick={onStartExam}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
          >
            התחל מבחן עכשיו
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam, idx) => (
            <div
              key={exam.id || idx}
              onClick={() => setSelectedExam(selectedExam?.id === exam.id ? null : exam)}
              className="cursor-pointer rounded-2xl glass-panel p-5 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                      exam.passed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {exam.passed ? '✓' : '✗'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">ציון: {exam.score}%</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        דרגה {exam.licenseType || 'B'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      <span>תשובות נכונות: {exam.correctAnswers} מתוך {exam.totalQuestions || 30}</span>
                      <span>שגיאות: {exam.wrongAnswers}</span>
                      <span>זמן: {Math.round((exam.timeTaken || 0) / 60)} דקות</span>
                      <span>
                        תאריך: {new Date(exam.createdAt).toLocaleDateString('he-IL')} בשעה{' '}
                        {new Date(exam.createdAt).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      exam.passed
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-300 border border-red-500/20'
                    }`}
                  >
                    {exam.passed ? 'עבר בהצלחה' : 'נכשל'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedExam?.id === exam.id ? '▲ סגור פירוט' : '▼ הצג פירוט'}
                  </span>
                </div>
              </div>

              {/* Expanded Category Breakdown */}
              {selectedExam?.id === exam.id && exam.categoryBreakdown && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in">
                  <div className="text-xs font-bold text-slate-300 mb-3">פירוט לפי נושאי מבחן:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(exam.categoryBreakdown).map(([cat, data]: [string, any]) => (
                      <div key={cat} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                        <div className="font-semibold text-slate-200">{cat}</div>
                        <div className="text-slate-400 mt-1">
                          {data.correct} / {data.total} נכונות (
                          {data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0}%)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
