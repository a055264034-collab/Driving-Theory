import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { connectToDatabase, isMongoConnected } from '@/lib/mongodb';
import { QuestionModel } from '@/models/Question';
import { Question } from '@/types';

// Fallback loader from local JSON file
function loadQuestionsFromFile(): Question[] {
  const filePath = path.join(process.cwd(), 'src', 'data', 'questions_he.json');
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing questions_he.json:', e);
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const licenseType = searchParams.get('licenseType') || 'B';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 0;
    const random = searchParams.get('random') === 'true';

    let allQuestions: Question[] = [];

    // Try Mongo first if connected
    try {
      const conn = await connectToDatabase();
      if (conn && isMongoConnected()) {
        const query: any = {};
        if (category && category !== 'all' && category !== 'הכל') {
          query.category = category;
        }
        if (licenseType && licenseType !== 'all') {
          query.licenseTypes = licenseType;
        }

        const docs = await QuestionModel.find(query).lean();
        if (docs && docs.length > 0) {
          allQuestions = docs.map((d: any) => ({
            id: d.id,
            questionNumber: d.questionNumber,
            text: d.text,
            answers: d.answers,
            correctAnswerIndex: d.correctAnswerIndex,
            category: d.category,
            imageUrl: d.imageUrl,
            licenseTypes: d.licenseTypes,
          }));
        }
      }
    } catch (dbErr) {
      // Continue to file fallback
    }

    // Fallback to local JSON if Mongo empty or disconnected
    if (allQuestions.length === 0) {
      allQuestions = loadQuestionsFromFile();

      if (category && category !== 'all' && category !== 'הכל') {
        allQuestions = allQuestions.filter((q) => q.category === category);
      }

      if (licenseType && licenseType !== 'all') {
        allQuestions = allQuestions.filter((q) =>
          q.licenseTypes && q.licenseTypes.includes(licenseType as any)
        );
      }
    }

    // Randomize if requested
    if (random) {
      allQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
    }

    // Limit count
    if (limit > 0 && allQuestions.length > limit) {
      allQuestions = allQuestions.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      count: allQuestions.length,
      questions: allQuestions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to load questions' },
      { status: 500 }
    );
  }
}
