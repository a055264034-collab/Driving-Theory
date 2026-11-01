'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DriveLearnDashboard from '@/components/DriveLearnDashboard';
import ExamSimulator from '@/components/ExamSimulator';
import LeitnerTrainer from '@/components/LeitnerTrainer';
import TrafficSignsView from '@/components/TrafficSignsView';
import HistoryView from '@/components/HistoryView';
import { getUserStats, UserStats } from '@/lib/storage';
import { LicenseType } from '@/types';
import {
  Menu,
  Home as HomeIcon,
  BookOpen,
  Trophy,
  BarChart2,
  Shield,
  User,
  X,
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>('B');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<UserStats>({
    selectedLicense: 'B',
    studyStreak: 1,
    lastStudyDate: '',
    totalAnswered: 0,
    totalCorrect: 0,
    totalStudyTimeSeconds: 0,
    recentQuestions: [],
    examScoreHistory: [],
    leitnerCards: {},
    categoryStats: {},
  });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [practiceCategory, setPracticeCategory] = useState<string | undefined>(undefined);

  // Load history from API
  const loadHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (data.success && data.history) {
        setRecentExams(data.history);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  useEffect(() => {
    setMounted(true);
    const loadedStats = getUserStats();
    if (loadedStats.totalAnswered > 0) {
      setStats(loadedStats);
      setSelectedLicense(loadedStats.selectedLicense || 'B');
    }
    loadHistory();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f3f6fa] relative" dir="ltr">
      {/* Desktop Sidebar (visible on lg screens, hidden on mobile) */}
      <div className="hidden lg:block shrink-0" dir="rtl">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            if (tab !== 'practice') setPracticeCategory(undefined);
            setCurrentTab(tab);
          }}
          userName="אריה שובר"
        />
      </div>

      {/* Mobile Slide-Over Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-start" dir="rtl">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer content (slides from right for natural RTL feel) */}
          <div className="relative z-50 h-full animate-in slide-in-from-right duration-200 shadow-2xl" dir="rtl">
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={(tab) => {
                if (tab !== 'practice') setPracticeCategory(undefined);
                setCurrentTab(tab);
                setMobileDrawerOpen(false);
              }}
              userName="אריה שובר"
              onCloseMobile={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen ${
          currentTab === 'exam' ? 'pb-6' : 'pb-24 lg:pb-6'
        } overflow-y-auto`}
        dir="rtl"
      >
        {/* Mobile Header Bar (visible only on mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all"
              aria-label="פתח תפריט"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1" dir="ltr">
              <span className="text-lg font-black text-[#0c1b33]">Drive</span>
              <span className="text-lg font-black text-[#1d68d8]">Learn</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1d68d8] border border-blue-200">
              דרגה {selectedLicense}
            </span>
            <div className="flex items-center gap-1.5 pl-0.5">
              <div className="w-7 h-7 rounded-full bg-[#0c1b33] flex items-center justify-center text-white font-bold text-xs shadow-xs">
                א
              </div>
              <span className="text-xs font-bold text-slate-800 hidden xs:inline">אריה שובר</span>
            </div>
          </div>
        </header>

        {/* Inner Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
          {currentTab === 'dashboard' && (
            <DriveLearnDashboard
              stats={stats}
              selectedLicense={selectedLicense}
              onStartExam={() => setCurrentTab('exam')}
              onStartPractice={() => {
                setPracticeCategory(undefined);
                setCurrentTab('practice');
              }}
              onStartSigns={() => setCurrentTab('signs')}
              onStartCategoryPractice={(cat) => {
                setPracticeCategory(cat);
                setCurrentTab('practice');
              }}
              onStatsUpdated={() => setStats(getUserStats())}
            />
          )}

          {currentTab === 'exam' && (
            <div className="py-2 sm:py-4">
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-200">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white shadow-xs border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ← חזרה לדף הבית
                </button>
                <div className="text-xs sm:text-sm font-bold text-[#0c1b33]">
                  מבחן סימולציה רשמי • דרגה B
                </div>
              </div>
              <ExamSimulator
                licenseType={selectedLicense}
                onExit={() => {
                  setCurrentTab('dashboard');
                  setStats(getUserStats());
                  loadHistory();
                }}
                onExamSaved={() => {
                  loadHistory();
                  setStats(getUserStats());
                }}
              />
            </div>
          )}

          {currentTab === 'practice' && (
            <div className="py-2 sm:py-4">
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-200">
                <button
                  onClick={() => {
                    setPracticeCategory(undefined);
                    setCurrentTab('dashboard');
                  }}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white shadow-xs border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ← חזרה לדף הבית
                </button>
                <div className="text-xs sm:text-sm font-bold text-[#0c1b33]">
                  {practiceCategory
                    ? `אימון ממוקד בנושא: ${practiceCategory}`
                    : 'אימון שאלות חכם (שיטת לייטנר)'}
                </div>
              </div>
              <LeitnerTrainer
                licenseType={selectedLicense}
                filterCategory={practiceCategory}
                onExit={() => {
                  setPracticeCategory(undefined);
                  setCurrentTab('dashboard');
                }}
                onStatsUpdated={() => setStats(getUserStats())}
              />
            </div>
          )}

          {currentTab === 'signs' && (
            <div className="py-2 sm:py-4">
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-200">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white shadow-xs border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ← חזרה לדף הבית
                </button>
                <div className="text-xs sm:text-sm font-bold text-[#0c1b33]">
                  קטלוג תמרורי ישראל הרשמי
                </div>
              </div>
              <TrafficSignsView onBack={() => setCurrentTab('dashboard')} />
            </div>
          )}

          {currentTab === 'progress' && (
            <div className="py-2 sm:py-4">
              <div className="flex items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-200">
                <button
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white shadow-xs border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  ← חזרה לדף הבית
                </button>
                <div className="text-xs sm:text-sm font-bold text-[#0c1b33]">דוחות והתקדמות</div>
              </div>
              <HistoryView
                exams={recentExams}
                onStartExam={() => setCurrentTab('exam')}
              />
            </div>
          )}

          {currentTab === 'settings' && (
            <div className="py-4 sm:py-8 max-w-2xl mx-auto space-y-4">
              <div className="p-5 rounded-2xl bg-white shadow-xs border border-slate-200">
                <h3 className="text-base font-bold text-[#0c1b33] mb-4">הגדרות חשבון ולמידה</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-600">שם משתמש:</span>
                    <span className="font-bold text-slate-900">אריה שובר</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-600">דרגת רישיון נבחרת:</span>
                    <span className="font-bold text-[#1d68d8]">דרגה B - רכב פרטי ומסחרי</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-600">מאגר משרד התחבורה:</span>
                    <span className="text-emerald-600 font-bold">1,802 שאלות מסונכרנות ✓</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (visible ONLY on mobile when not in exam mode) */}
        {currentTab !== 'exam' && (
          <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-3 flex items-center justify-around shadow-lg"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
            dir="rtl"
          >
            <button
              onClick={() => {
                setPracticeCategory(undefined);
                setCurrentTab('dashboard');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                currentTab === 'dashboard'
                  ? 'text-[#1d68d8] font-bold bg-blue-50/80 scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HomeIcon className="w-5 h-5" />
              <span className="text-[10px]">בית</span>
            </button>

            <button
              onClick={() => {
                setPracticeCategory(undefined);
                setCurrentTab('practice');
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                currentTab === 'practice'
                  ? 'text-[#1d68d8] font-bold bg-blue-50/80 scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px]">תרגול</span>
            </button>

            <button
              onClick={() => setCurrentTab('exam')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                currentTab === 'exam'
                  ? 'text-[#1d68d8] font-bold bg-blue-50/80 scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-[10px]">מבחנים</span>
            </button>

            <button
              onClick={() => setCurrentTab('signs')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                currentTab === 'signs'
                  ? 'text-[#1d68d8] font-bold bg-blue-50/80 scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="text-[10px]">תמרורים</span>
            </button>

            <button
              onClick={() => setCurrentTab('progress')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                currentTab === 'progress'
                  ? 'text-[#1d68d8] font-bold bg-blue-50/80 scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="text-[10px]">התקדמות</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
