'use client';

import React, { useState } from 'react';
import {
  Car,
  Compass,
  FileCheck2,
  Brain,
  History,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { LicenseType } from '@/types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedLicense: LicenseType;
  setSelectedLicense: (lic: LicenseType) => void;
  onSyncTriggered?: () => void;
  isSyncing?: boolean;
}

const LICENSES: { code: LicenseType; title: string; subtitle: string; icon: string }[] = [
  { code: 'B', title: 'דרגה B', subtitle: 'רכב פרטי ומסחרי עד 3.5 טון', icon: '🚗' },
  { code: 'A', title: 'דרגה A / A1 / A2', subtitle: 'אופנועים וקטנועים', icon: '🏍️' },
  { code: 'C', title: 'דרגה C / C1', subtitle: 'משא קל ומשא כבד', icon: '🚚' },
  { code: 'D', title: 'דרגה D / D1', subtitle: 'אוטובוסים ומוניות', icon: '🚌' },
  { code: '1', title: 'דרגה 1', subtitle: 'טרקטור ורכב חקלאי', icon: '🚜' },
];

export default function Navbar({
  currentTab,
  setCurrentTab,
  selectedLicense,
  setSelectedLicense,
  onSyncTriggered,
  isSyncing = false,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeLicenseObj = LICENSES.find((l) => l.code === selectedLicense) || LICENSES[0];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="flex items-center gap-2.5 text-right group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Car className="w-5 h-5 text-cyan-400 group-hover:rotate-6 transition-transform" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-lg text-white tracking-wide">
                  <span>תאוריה</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    מאסטר
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-medium px-1.5 py-0.5 rounded-full border border-blue-500/30">
                    2026
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">מאגר משרד התחבורה הרשמי</div>
              </div>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>לוח בקרה</span>
            </button>

            <button
              onClick={() => setCurrentTab('exam')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'exam'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>מבחן סימולציה</span>
            </button>

            <button
              onClick={() => setCurrentTab('leitner')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'leitner'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>כרטיסיות לייטנר</span>
            </button>

            <button
              onClick={() => setCurrentTab('signs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'signs'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>קטלוג תמרורים</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'history'
                  ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>היסטוריה ודוחות</span>
            </button>
          </nav>

          {/* Right Action Controls: License Selector & Sync Button */}
          <div className="flex items-center gap-3">
            {/* License Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-sm text-slate-200 hover:text-white transition-all shadow-sm"
              >
                <span>{activeLicenseObj.icon}</span>
                <span className="font-semibold">{activeLicenseObj.title}</span>
                <span className="text-xs text-slate-400">▾</span>
              </button>

              {dropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 text-right animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-800 mb-1">
                    בחר דרגת רישיון למבחן
                  </div>
                  {LICENSES.map((lic) => (
                    <button
                      key={lic.code}
                      onClick={() => setSelectedLicense(lic.code)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-right text-xs transition-colors ${
                        selectedLicense === lic.code
                          ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lic.icon}</span>
                        <div>
                          <div>{lic.title}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{lic.subtitle}</div>
                        </div>
                      </div>
                      {selectedLicense === lic.code && <Check className="w-4 h-4 text-blue-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Button */}
            {onSyncTriggered && (
              <button
                onClick={onSyncTriggered}
                disabled={isSyncing}
                title="סנכרן שאלות ממאגר משרד התחבורה הרשמי"
                className={`p-2 rounded-lg border transition-all ${
                  isSyncing
                    ? 'bg-blue-900/30 border-blue-500/50 text-blue-400'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/90 py-2 px-1 text-xs">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          <Compass className="w-4 h-4" />
          <span>ראשי</span>
        </button>
        <button
          onClick={() => setCurrentTab('exam')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'exam' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>מבחן</span>
        </button>
        <button
          onClick={() => setCurrentTab('leitner')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'leitner' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          <Brain className="w-4 h-4" />
          <span>לייטנר</span>
        </button>
        <button
          onClick={() => setCurrentTab('signs')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'signs' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>תמרורים</span>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`flex flex-col items-center gap-1 ${currentTab === 'history' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <History className="w-4 h-4" />
          <span>היסטוריה</span>
        </button>
      </div>
    </header>
  );
}
