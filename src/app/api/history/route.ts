import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { ExamHistoryModel } from '@/models/ExamHistory';

const HISTORY_FILE = path.join(process.cwd(), 'src', 'data', 'exam_history.json');

function readHistoryFromFile(): any[] {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading history file:', e);
    }
  }
  return [];
}

function writeHistoryToFile(list: any[]) {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving history file:', e);
  }
}

export async function GET() {
  try {
    let history: any[] = [];

    // Try MongoDB
    try {
      const conn = await connectToDatabase();
      if (conn && isMongoConnected()) {
        history = await ExamHistoryModel.find().sort({ createdAt: -1 }).limit(50).lean();
      }
    } catch (e) {
      // Continue to file
    }

    if (history.length === 0) {
      history = readHistoryFromFile().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Calculate aggregated stats
    const totalExams = history.length;
    const passedExams = history.filter((h) => h.passed).length;
    const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;
    const avgScore =
      totalExams > 0
        ? Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / totalExams)
        : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalExams,
        passedExams,
        passRate,
        avgScore,
      },
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      licenseType = 'B',
      totalQuestions = 30,
      correctAnswers = 0,
      wrongAnswers = 0,
      score = 0,
      passed = false,
      timeTaken = 0,
      answers = [],
      categoryBreakdown = {},
    } = body;

    const newEntry = {
      id: 'exam_' + Date.now(),
      licenseType,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score,
      passed,
      timeTaken,
      answers,
      categoryBreakdown,
      createdAt: new Date().toISOString(),
    };

    // Save to Mongo if available
    let savedToMongo = false;
    try {
      const conn = await connectToDatabase();
      if (conn && isMongoConnected()) {
        await ExamHistoryModel.create({
          ...newEntry,
          createdAt: new Date(),
        });
        savedToMongo = true;
      }
    } catch (e) {
      console.warn('MongoDB history save fallback:', e);
    }

    // Always persist to local file as backup
    const list = readHistoryFromFile();
    list.unshift(newEntry);
    writeHistoryToFile(list.slice(0, 100)); // keep last 100

    return NextResponse.json({
      success: true,
      savedToMongo,
      entry: newEntry,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
