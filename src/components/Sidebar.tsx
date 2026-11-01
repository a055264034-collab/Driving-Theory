'use client';

import {
  Home,
  BookOpen,
  BarChart2,
  Trophy,
  Settings,
  Car,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  onCloseMobile,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'בית', icon: Home },
    { id: 'practice', label: 'תרגול שאלות', icon: BookOpen },
    { id: 'progress', label: 'ההתקדמות שלי', icon: BarChart2 },
    { id: 'exam', label: 'מבחנים מדומים', icon: Trophy },
    { id: 'settings', label: 'הגדרות', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-[260px] bg-[#0c1b33] text-slate-300 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 shadow-2xl lg:shadow-none">
      <div>
        {/* Mobile close button */}
        {onCloseMobile && (
          <div className="flex justify-end p-3 lg:hidden">
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Brand Logo */}
        <div
          className="pt-6 pb-6 flex flex-col items-center justify-center cursor-pointer"
          onClick={() => handleSelect('dashboard')}
        >
          {/* Stylized curved road highway icon */}
          <div className="relative w-16 h-12 flex items-center justify-center mb-1">
            <svg viewBox="0 0 80 50" className="w-full h-full drop-shadow">
              <path
                d="M 15 45 C 28 28, 48 10, 75 5 C 65 18, 45 38, 15 45 Z"
                fill="#2563eb"
              />
              <path
                d="M 10 47 C 32 30, 52 14, 78 5"
                stroke="#38bdf8"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M 22 42 C 38 27, 54 16, 72 7"
                stroke="#ffffff"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
          </div>

          <div dir="ltr" className="text-2xl font-black text-white tracking-tight flex items-center">
            <span>Drive</span>
            <span className="text-[#38bdf8]">Learn</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1d68d8] text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-[#162a4d]/60'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-right flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4">
        {/* Promotional motivational badge */}
        <div className="relative overflow-hidden rounded-2xl bg-[#102342]/90 p-4 border border-blue-500/15 text-center shadow-inner">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 mx-auto mb-2 flex items-center justify-center">
            <Car className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-white text-xs font-bold leading-relaxed font-sans">
            לומדים היום,
            <br />
            <span className="text-slate-100 italic">נוהגים בבטחה מחר!</span>
          </div>
          <div className="w-20 h-1 bg-[#1d68d8] rounded-full mx-auto mt-2.5 transform -rotate-2" />
        </div>
      </div>
    </aside>
  );
}
