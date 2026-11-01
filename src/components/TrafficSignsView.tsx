'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface OfficialSign {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryHe: string;
  description: string;
  imageUrl: string;
  relatedQuestionText?: string;
  correctAnswer?: string;
}

interface TrafficSignsViewProps {
  onBack: () => void;
}

export default function TrafficSignsView({ onBack }: TrafficSignsViewProps) {
  const [signs, setSigns] = useState<OfficialSign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quizSign, setQuizSign] = useState<OfficialSign | null>(null);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);

  useEffect(() => {
    async function loadSigns() {
      setLoading(true);
      try {
        const res = await fetch('/api/signs');
        const data = await res.json();
        if (data.success && data.signs) {
          setSigns(data.signs);
        }
      } catch (e) {
        console.error('Failed to load signs:', e);
      } finally {
        setLoading(false);
      }
    }
    loadSigns();
  }, []);

  const categories = [
    { id: 'all', label: 'כל התמרורים' },
    { id: 'תמרורי אזהרה', label: 'אזהרה (100)' },
    { id: 'זכות קדימה והוריה', label: 'זכות קדימה (200)' },
    { id: 'איסור והגבלה', label: 'איסור והגבלה (300)' },
    { id: 'חובה והוראה', label: 'חובה והוראה (400)' },
    { id: 'מודיעין והדרכה', label: 'מודיעין והדרכה (500)' },
    { id: 'תמרורי משרד התחבורה', label: 'מאגר משרד התחבורה' },
  ];

  const filteredSigns = signs.filter((sign) => {
    const matchesCat =
      selectedCategory === 'all' ||
      sign.categoryHe === selectedCategory ||
      sign.category === selectedCategory;
    const matchesSearch =
      sign.name?.includes(searchQuery) ||
      sign.description?.includes(searchQuery) ||
      sign.code?.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-in fade-in duration-200" dir="rtl">
      {/* Header bar */}
      <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1 sm:mb-1.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl shadow-xs shrink-0">
              🗼
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
                לוח תמרורי ישראל הרשמי
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                מאגר התמרורים הרשמי של משרד התחבורה ({signs.length} תמרורים פעילים במערכת)
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש לפי שם תמרור או קוד מספרי..."
            className="w-full pl-4 pr-10 py-2 sm:py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1d68d8] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[#1d68d8] text-white shadow-md shadow-blue-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <div className="text-xs font-bold text-slate-600">טוען תמרורים מהמאגר הממשלתי...</div>
        </div>
      ) : filteredSigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-800">לא נמצאו תמרורים מתאימים לחיפוש</div>
          <div className="text-xs text-slate-500 mt-1">נסה לחפש קוד אחר או לבחור בקטגוריה אחרת</div>
        </div>
      ) : (
        /* Signs Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSigns.map((sign) => (
            <div
              key={sign.id}
              className="rounded-2xl bg-white p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                {/* Code badge & Category */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    תמרור {sign.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {sign.categoryHe || 'תמרור'}
                  </span>
                </div>

                {/* Official Government Image */}
                <div className="flex items-center justify-center p-3 mb-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[130px]">
                  {sign.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sign.imageUrl}
                      alt={sign.name}
                      className="max-h-24 w-auto object-contain hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="text-3xl">🚸</div>
                  )}
                </div>

                {/* Name & Description */}
                <h3 className="text-sm font-extrabold text-slate-900 mb-1 leading-snug line-clamp-2">
                  {sign.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                  {sign.description}
                </p>
              </div>

              {/* Quiz button */}
              <button
                onClick={() => {
                  setQuizSign(sign);
                  setQuizAnswered(false);
                  setQuizSelected(null);
                }}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#1d68d8] border border-slate-200 hover:border-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>בחן את עצמך</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Self-Quiz Modal */}
      {quizSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 text-right shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-500">
                בוחן ידע: תמרור מס&apos; {quizSign.code}
              </span>
              <button
                onClick={() => setQuizSign(null)}
                className="text-slate-400 hover:text-slate-800 text-xs font-bold"
              >
                ✕ סגור
              </button>
            </div>

            {/* Sign Image */}
            <div className="flex justify-center p-3 bg-slate-50 rounded-xl mb-4 border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={quizSign.imageUrl}
                alt={quizSign.name}
                className="max-h-28 w-auto object-contain"
              />
            </div>

            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-4 text-center leading-snug">
              {quizSign.relatedQuestionText || `מה משמעות תמרור מס' ${quizSign.code}?`}
            </h4>

            {/* 4 Choices */}
            <div className="space-y-2 mb-5">
              {[
                quizSign.correctAnswer || quizSign.name,
                'הדרך סגורה לחלוטין לכל כלי הרכב',
                'מקום חניה מוסדר לרכב בטחון בלבד',
                'אסורה פנייה שמאלה ופרסה בצומת',
              ]
                .sort()
                .map((opt, i) => {
                  const isCorrect = opt === (quizSign.correctAnswer || quizSign.name);
                  const isPicked = quizSelected === opt;

                  let style =
                    'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
                  if (quizAnswered) {
                    if (isCorrect) {
                      style = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
                    } else if (isPicked && !isCorrect) {
                      style = 'bg-red-50 border-red-500 text-red-800 line-through';
                    } else {
                      style = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={quizAnswered}
                      onClick={() => {
                        setQuizSelected(opt);
                        setQuizAnswered(true);
                      }}
                      className={`w-full p-3 rounded-xl border text-xs text-right font-medium transition-all flex items-center justify-between ${style}`}
                    >
                      <span>{opt}</span>
                      {quizAnswered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {quizAnswered && isPicked && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
            </div>

            {quizAnswered && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-slate-800 leading-relaxed mb-4">
                <strong>הסבר החוק:</strong> {quizSign.description}
              </div>
            )}

            <button
              onClick={() => setQuizSign(null)}
              className="w-full py-2.5 rounded-xl bg-[#1d68d8] hover:bg-[#1556b8] text-white font-bold text-xs transition-colors"
            >
              סגור והמשך
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
