import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-rubik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'תאוריה מאסטר | מאגר שאלות משרד התחבורה הרשמי 2025/2026',
  description:
    'מערכת הכנה חכמה למבחן התאוריה הישראלי: מאגר 1,802 שאלות רשמיות של משרד התחבורה, שיטת לייטנר (חזרות מרווחות), מדד מוכנות למבחן, וסימולציות אמיתיות.',
  keywords: 'תאוריה, מבחן תאוריה, לימוד נהיגה, משרד התחבורה, שאלות תאוריה, תמרורים, רישיון B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} dark`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
