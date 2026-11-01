import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: string;
  questionNumber: string;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  category: string;
  imageUrl: string | null;
  licenseTypes: string[];
}

interface SignItem {
  id: string;
  code: string;
  name: string;
  category: string;
  categoryHe: string;
  description: string;
  imageUrl: string;
  relatedQuestionText: string;
  correctAnswer: string;
}

const questionsPath = path.join(process.cwd(), 'src', 'data', 'questions_he.json');
const raw = fs.readFileSync(questionsPath, 'utf-8');
const questions: Question[] = JSON.parse(raw);

const signQuestions = questions.filter((q) => q.category === 'תמרורים' && q.imageUrl);

console.log(`Found ${signQuestions.length} sign questions with government images.`);

// Map of official Israeli signs
const OFFICIAL_SIGNS_BASE: Array<{
  code: string;
  name: string;
  categoryHe: string;
  description: string;
}> = [
  // 100 - אזהרה
  { code: '101', name: 'כביש מתעקל ימינה', categoryHe: 'תמרורי אזהרה', description: 'אזהרה מפני עיקול מסוכן ימינה בכביש, יש להאט את המהירות בהתאם לתנאי הדרך.' },
  { code: '102', name: 'כביש מתעקל שמאלה', categoryHe: 'תמרורי אזהרה', description: 'אזהרה מפני עיקול מסוכן שמאלה בכביש, יש להאט את המהירות בהתאם לתנאי הדרך.' },
  { code: '103', name: 'עיקולים מסוכנים בזה אחר זה ימינה ואחר כך שמאלה', categoryHe: 'תמרורי אזהרה', description: 'סדרת עיקולים מסוכנים בדרך, האט וסע בזהירות.' },
  { code: '104', name: 'עיקולים מסוכנים שמאלה ואחר כך ימינה', categoryHe: 'תמרורי אזהרה', description: 'סדרת עיקולים מסוכנים בדרך, האט וסע בזהירות.' },
  { code: '105', name: 'ירידה תלולה', categoryHe: 'תמרורי אזהרה', description: 'ירידה תלולה עם סכנת התחממות בלמים, שלב להילוך נמוך.' },
  { code: '107', name: 'כביש משובש או פסי האטה', categoryHe: 'תמרורי אזהרה', description: 'פני הדרך משובשים או קיימים פסי האטה מלאכותיים.' },
  { code: '110', name: 'היצרות הכביש משני הצדדים', categoryHe: 'תמרורי אזהרה', description: 'הכביש הולך ונהיה צר משני צדדיו.' },
  { code: '111', name: 'היצרות הכביש מצד ימין', categoryHe: 'תמרורי אזהרה', description: 'הכביש נהיה צר מצד ימין, היערך להשתלבות.' },
  { code: '112', name: 'היצרות הכביש מצד שמאל', categoryHe: 'תמרורי אזהרה', description: 'הכביש נהיה צר מצד שמאל, היערך להשתלבות.' },
  { code: '115', name: 'הולכי רגל בקרבת מקום', categoryHe: 'תמרורי אזהרה', description: 'אזהרה: הולכי רגל או ילדים עשויים להימצא על הכביש.' },
  { code: '116', name: 'מעבר חציה בקרבת מקום', categoryHe: 'תמרורי אזהרה', description: 'התקרבות למעבר חציה מסומן, האט ותן זכות קדימה להולכי רגל.' },
  { code: '117', name: 'ילדים בקרבת מקום', categoryHe: 'תמרורי אזהרה', description: 'סכנת הימצאות ילדים על הכביש ליד מוסד חינוכי או מגרש משחקים.' },
  { code: '120', name: 'צומת הצטלבות', categoryHe: 'תמרורי אזהרה', description: 'התקרבות לצומת הצטלבות דרכים.' },
  { code: '121', name: 'צומת קמץ (T)', categoryHe: 'תמרורי אזהרה', description: 'התקרבות לצומת קמץ.' },
  { code: '128', name: 'רמזור לפניך', categoryHe: 'תמרורי אזהרה', description: 'התקרבות לצומת או מקום מרומזר, היערך לעצירה.' },
  { code: '133', name: 'מפגש מסילת ברזל', categoryHe: 'תמרורי אזהרה', description: 'אזהרה מפני מפגש מסילת ברזל ללא מחסום.' },

  // 200 - הוריה וזכות קדימה
  { code: '201', name: 'עצור ותן זכות קדימה', categoryHe: 'זכות קדימה והוריה', description: 'חובת עצירה מוחלטת לפני קו העצירה ומתן זכות קדימה לכל תנועה חוצה.' },
  { code: '202', name: 'תן זכות קדימה', categoryHe: 'זכות קדימה והוריה', description: 'האט ותן זכות קדימה לתנועה החוצה או לתנועה בכיכר. אין חובת עצירה אם הדרך פנויה.' },
  { code: '205', name: 'מעגל תנועה (כיכר)', categoryHe: 'זכות קדימה והוריה', description: 'סע במעגל נגד כיוון השעון ותן זכות קדימה לרכב הנע כבר בתוך המעגל.' },
  { code: '213', name: 'התחלף זכות קדימה', categoryHe: 'זכות קדימה והוריה', description: 'זכות קדימה לתנועה הבאה ממול בקטע דרך צר.' },
  { code: '214', name: 'זכות קדימה על פני התנועה הבאה ממול', categoryHe: 'זכות קדימה והוריה', description: 'יש לך זכות קדימה על פני רכב ממול בקטע הדרך הצר.' },

  // 300 - איסור והגבלה
  { code: '301', name: 'אין כניסה לכל כלי רכב', categoryHe: 'איסור והגבלה', description: 'הכניסה אסורה לחלוטין מכל כיוון זה לכל רכב מנועי ושאינו מנועי.' },
  { code: '302', name: 'הדרך סגורה לשני הכיוונים', categoryHe: 'איסור והגבלה', description: 'הדרך סגורה לכל כלי רכב בשני הכיוונים.' },
  { code: '303', name: 'אסורה פנייה שמאלה ופרסה', categoryHe: 'איסור והגבלה', description: 'אסורה פנייה שמאלה ואסורה פניית פרסה בצומת זה.' },
  { code: '304', name: 'אסורה פנייה ימינה', categoryHe: 'איסור והגבלה', description: 'אסורה פנייה ימינה בצומת זה.' },
  { code: '305', name: 'אסורה פניית פרסה לשמאל', categoryHe: 'איסור והגבלה', description: 'אסור לבצע פניית פרסה שמאלה.' },
  { code: '306', name: 'מהירות מרבית מותרת', categoryHe: 'איסור והגבלה', description: 'המהירות המרבית המצוינת בתמרור אסורה לחריגה עד לתמרור ביטול או צומת הבא.' },
  { code: '307', name: 'קצה קטע מהירות מוגבלת', categoryHe: 'איסור והגבלה', description: 'ביטול הגבלת המהירות הקודמת וחזרה למהירות המותרת בחוק.' },
  { code: '308', name: 'אסורה עקיפת רכב מנועי', categoryHe: 'איסור והגבלה', description: 'אסור לעקוף רכב מנועי הנע על יותר משני גלגלים.' },
  { code: '309', name: 'קצה איסור עקיפה', categoryHe: 'איסור והגבלה', description: 'ביטול איסור העקיפה.' },
  { code: '313', name: 'אסורה כניסת רכב משא', categoryHe: 'איסור והגבלה', description: 'אסורה כניסת רכב מסחרי ומשא שמשקלו הכולל המותר עולה על המצוין.' },
  { code: '317', name: 'איסור חניה ועצירה', categoryHe: 'איסור והגבלה', description: 'אסורה כל עצירה, העמדה וחניה של רכב בצד הדרך שבו הוצב התמרור.' },
  { code: '318', name: 'איסור חניה בלבד', categoryHe: 'איסור והגבלה', description: 'אסורה חניה, אך מותרת עצירה רגעית להורדה או העלאת נוסעים בלבד.' },

  // 400 - חובה והוראה
  { code: '401', name: 'סע ישר בלבד', categoryHe: 'חובה והוראה', description: 'חובה לנסוע ישר בלבד לפני התמרור.' },
  { code: '402', name: 'סע ימינה בלבד', categoryHe: 'חובה והוראה', description: 'חובה לפנות ימינה בלבד לפני התמרור.' },
  { code: '403', name: 'סע שמאלה בלבד', categoryHe: 'חובה והוראה', description: 'חובה לפנות שמאלה בלבד לפני התמרור.' },
  { code: '408', name: 'עבור את המכשול מימין או משמאל', categoryHe: 'חובה והוראה', description: 'מותר לעבור את המכשול משני צדדיו.' },
  { code: '417', name: 'נתיב לתחבורה ציבורית', categoryHe: 'חובה והוראה', description: 'נתיב המיועד לתנועת אוטובוסים ומוניות בלבד בשעות המצוינות.' },

  // 500 - מודיעין והדרכה
  { code: '501', name: 'דרך מהירה (כביש מהיר)', categoryHe: 'מודיעין והדרכה', description: 'כניסה לכביש מהיר. מהירות מרבית 110 קמ"ש אלא אם צוין אחרת. אסורה כניסת הולכי רגל ורכב איטי.' },
  { code: '502', name: 'קצה דרך מהירה', categoryHe: 'מודיעין והדרכה', description: 'יציאה מכביש מהיר.' },
  { code: '505', name: 'מעבר חציה להולכי רגל', categoryHe: 'מודיעין והדרכה', description: 'מקום מעבר חציה. חובה לתת זכות קדימה להולך רגל החוצה או מתכוון לחצות.' },
  { code: '511', name: 'חניה מוסדרת לרכב', categoryHe: 'מודיעין והדרכה', description: 'מקום מוסדר לחניית כלי רכב.' },
  { code: '512', name: 'חניה לנכים בלבד', categoryHe: 'מודיעין והדרכה', description: 'מקום חניה שמור לרכב הנושא תג נכה בלבד.' },
];

// Match each sign with an actual government image question if available
const signsCatalog: SignItem[] = [];

for (let i = 0; i < OFFICIAL_SIGNS_BASE.length; i++) {
  const base = OFFICIAL_SIGNS_BASE[i];
  // Find a matching sign question in data.gov.il questions
  const match = signQuestions.find((q) => {
    return (
      q.text.includes(base.name) ||
      q.answers[q.correctAnswerIndex]?.includes(base.name) ||
      q.text.includes(base.code)
    );
  }) || signQuestions[i % signQuestions.length];

  signsCatalog.push({
    id: `sign_${base.code}`,
    code: base.code,
    name: base.name,
    category: base.categoryHe,
    categoryHe: base.categoryHe,
    description: base.description,
    imageUrl: match?.imageUrl || '',
    relatedQuestionText: match?.text || `מה משמעות תמרור מס' ${base.code}?`,
    correctAnswer: match ? match.answers[match.correctAnswerIndex] : base.name,
  });
}

// Also add all unique image sign questions from the government dataset
signQuestions.forEach((q, idx) => {
  if (idx < 100 && !signsCatalog.some((s) => s.imageUrl === q.imageUrl)) {
    signsCatalog.push({
      id: `gov_sign_${q.questionNumber}`,
      code: q.questionNumber,
      name: q.answers[q.correctAnswerIndex] || `תמרור מס' ${q.questionNumber}`,
      category: 'תמרורים מהמאגר הרשמי',
      categoryHe: 'תמרורי משרד התחבורה',
      description: q.text,
      imageUrl: q.imageUrl!,
      relatedQuestionText: q.text,
      correctAnswer: q.answers[q.correctAnswerIndex],
    });
  }
});

const outPath = path.join(process.cwd(), 'src', 'data', 'officialSigns.json');
fs.writeFileSync(outPath, JSON.stringify(signsCatalog, null, 2), 'utf-8');
console.log(`Saved ${signsCatalog.length} official signs to ${outPath}`);
