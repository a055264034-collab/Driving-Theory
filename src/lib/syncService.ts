import * as fs from 'fs';
import * as path from 'path';
import { connectToDatabase, isMongoConnected } from './mongodb';
import { QuestionModel } from '@/models/Question';
import { SyncLogModel } from '@/models/SyncLog';
import { Question } from '@/types';

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search';
const RESOURCE_ID_HE = 'bf7cb748-f220-474b-a4d5-2d59f93db28d';
const BATCH_SIZE = 200;

interface RawGovRecord {
  _id: number;
  title2: string;
  description4: string;
  category: string;
}

function parseDescription(html: string): {
  answers: string[];
  correctAnswerIndex: number;
  imageUrl: string | null;
  licenseTypes: string[];
} {
  const answers: string[] = [];
  let correctAnswerIndex = -1;
  let imageUrl: string | null = null;
  const licenseTypes: string[] = [];

  // Extract answers from <li><span>...</span></li>
  const liRegex = /<li>\s*<span[^>]*>(.*?)<\/span>\s*<\/li>/gi;
  let match;
  let index = 0;

  while ((match = liRegex.exec(html)) !== null) {
    const rawAnswer = match[1]
      .replace(/<[^>]+>/g, '') // strip nested tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    answers.push(rawAnswer);

    const spanTag = match[0];
    if (spanTag.includes('id="correctAnswer') || spanTag.includes('id=\\"correctAnswer')) {
      correctAnswerIndex = index;
    }
    index++;
  }

  // Extract image URL from img src
  const imgMatch = html.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (imgMatch) {
    imageUrl = imgMatch[1];
  }

  // Extract license types: «B», «A», «C», etc.
  const licenseRegex = /«([^»]+)»/g;
  let licMatch;
  while ((licMatch = licenseRegex.exec(html)) !== null) {
    const code = licMatch[1].trim();
    const mapped = mapLicenseCode(code);
    if (mapped && !licenseTypes.includes(mapped)) {
      licenseTypes.push(mapped);
    }
  }

  return { answers, correctAnswerIndex, imageUrl, licenseTypes };
}

function mapLicenseCode(code: string): string | null {
  const map: Record<string, string> = {
    'B': 'B',
    'A': 'A',
    'A1': 'A1',
    'A2': 'A2',
    'C': 'C',
    'C1': 'C1',
    'D': 'D',
    'D1': 'D1',
    '1': '1',
    'В': 'B', // Cyrillic homoglyph
  };
  return map[code] || (['A','B','C','D','1'].includes(code) ? code : null);
}

export async function fetchQuestionsFromGov(maxRecords: number = 3000): Promise<Question[]> {
  const questions: Question[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total && questions.length < maxRecords) {
    const limit = Math.min(BATCH_SIZE, maxRecords - questions.length);
    const url = `${API_BASE}?resource_id=${RESOURCE_ID_HE}&limit=${limit}&offset=${offset}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch from data.gov.il: status ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error('data.gov.il API response success was false');
    }

    total = data.result.total || total;
    const records: RawGovRecord[] = data.result.records || [];
    if (records.length === 0) break;

    for (const record of records) {
      if (!record.title2 || !record.description4) continue;

      const numMatch = record.title2.match(/^(\d+)\.\s*/);
      const questionNumber = numMatch ? numMatch[1] : String(record._id);
      const questionText = record.title2.replace(/^\d+\.\s*/, '').trim();

      const { answers, correctAnswerIndex, imageUrl, licenseTypes } = parseDescription(record.description4);

      if (answers.length < 2 || correctAnswerIndex === -1) {
        continue;
      }

      // Map category
      let category = (record.category || 'כללי').trim();
      if (!category) category = 'כללי';

      const validLicenseTypes = licenseTypes.length > 0 ? (licenseTypes as any) : ['B'];

      questions.push({
        id: `q_${questionNumber}`,
        questionNumber,
        text: questionText,
        answers,
        correctAnswerIndex,
        category: category as any,
        imageUrl,
        licenseTypes: validLicenseTypes,
      });
    }

    offset += records.length;
  }

  return questions;
}

export async function syncQuestions(): Promise<{
  success: boolean;
  totalQuestions: number;
  syncedAt: string;
  source: string;
  savedToMongo: boolean;
  savedToFile: boolean;
}> {
  try {
    const questions = await fetchQuestionsFromGov();

    // 1. Save to local JSON file for ultra-fast local loading & offline support
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const questionsPath = path.join(dataDir, 'questions_he.json');
    fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2), 'utf-8');

    const metaPath = path.join(dataDir, 'questions_he_meta.json');
    const meta = {
      totalQuestions: questions.length,
      syncedAt: new Date().toISOString(),
      source: 'https://data.gov.il/dataset/tqhe',
      resourceId: RESOURCE_ID_HE,
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');

    let savedToMongo = false;
    // 2. If MongoDB is available, save to Mongo collection
    try {
      const conn = await connectToDatabase();
      if (conn && isMongoConnected()) {
        const bulkOps = questions.map((q) => ({
          updateOne: {
            filter: { id: q.id },
            update: {
              $set: {
                ...q,
                updatedAt: new Date(),
              },
            },
            upsert: true,
          },
        }));

        if (bulkOps.length > 0) {
          await QuestionModel.bulkWrite(bulkOps);
        }

        await SyncLogModel.create({
          status: 'success',
          totalQuestions: questions.length,
          source: 'data.gov.il',
          syncedAt: new Date(),
        });
        savedToMongo = true;
      }
    } catch (mongoErr: any) {
      console.warn('MongoDB sync skipped (will continue with JSON file store):', mongoErr?.message);
    }

    return {
      success: true,
      totalQuestions: questions.length,
      syncedAt: meta.syncedAt,
      source: meta.source,
      savedToMongo,
      savedToFile: true,
    };
  } catch (error: any) {
    try {
      const conn = await connectToDatabase();
      if (conn && isMongoConnected()) {
        await SyncLogModel.create({
          status: 'failed',
          totalQuestions: 0,
          source: 'data.gov.il',
          errorMessage: error?.message,
          syncedAt: new Date(),
        });
      }
    } catch (_) {}
    throw error;
  }
}
