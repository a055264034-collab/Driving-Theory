/**
 * Fetches theory exam questions from the Israeli Ministry of Transport
 * open data portal (data.gov.il CKAN API).
 * 
 * Data sources:
 * - Hebrew (tqhe): resource_id = bf7cb748-f220-474b-a4d5-2d59f93db28d
 * - Arabic (tqar): resource_id = fe998a65-83a3-45e5-b4b7-3e0ce86ae072
 * - Russian (tqru): resource_id = ca264280-1669-45ce-a96f-a4c9ed71e812
 * 
 * Run: npx ts-node scripts/fetch-questions.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search';
const BATCH_SIZE = 100;

// Resource IDs for each language
const RESOURCES = {
  he: 'bf7cb748-f220-474b-a4d5-2d59f93db28d',
  // ar: 'fe998a65-83a3-45e5-b4b7-3e0ce86ae072',
  // ru: 'ca264280-1669-45ce-a96f-a4c9ed71e812',
};

interface RawRecord {
  _id: number;
  title2: string;
  description4: string;
  category: string;
}

interface ParsedQuestion {
  id: string;
  questionNumber: string;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
  category: string;
  imageUrl: string | null;
  licenseTypes: string[];
}

/**
 * Parse the HTML description4 field to extract answers, correct answer, and metadata
 */
function parseDescription(html: string, questionNumber: string): {
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
  const liRegex = /<li>\s*<span[^>]*>(.*?)<\/span>\s*<\/li>/g;
  let match;
  let index = 0;

  while ((match = liRegex.exec(html)) !== null) {
    const answerText = match[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    answers.push(answerText);

    // Check if this is the correct answer (has id="correctAnswer...")
    const spanTag = match[0];
    if (spanTag.includes(`id="correctAnswer`) || spanTag.includes(`id=\\"correctAnswer`)) {
      correctAnswerIndex = index;
    }
    index++;
  }

  // Extract image URL
  const imgMatch = html.match(/src="(https?:\/\/[^"]+)"/);
  if (imgMatch) {
    imageUrl = imgMatch[1];
  }
  // Also try escaped quotes
  const imgMatch2 = html.match(/src=\\"(https?:\/\/[^\\]+)\\"/);
  if (!imageUrl && imgMatch2) {
    imageUrl = imgMatch2[1];
  }

  // Extract license types (e.g., «B», «C», «D», «A», «1»)
  const licenseRegex = /«([^»]+)»/g;
  let licMatch;
  while ((licMatch = licenseRegex.exec(html)) !== null) {
    const licType = licMatch[1].trim();
    // Map license codes
    const mappedType = mapLicenseType(licType);
    if (mappedType && !licenseTypes.includes(mappedType)) {
      licenseTypes.push(mappedType);
    }
  }

  return { answers, correctAnswerIndex, imageUrl, licenseTypes };
}

function mapLicenseType(code: string): string | null {
  const map: Record<string, string> = {
    'B': 'B',      // Private car
    'A': 'A',      // Motorcycle
    'A1': 'A1',    // Motorcycle up to 125cc
    'A2': 'A2',    // Motorcycle up to 35kW
    'C': 'C',      // Truck
    'C1': 'C1',    // Light truck
    'D': 'D',      // Bus
    'D1': 'D1',    // Minibus
    '1': '1',      // Tractor
    'В': 'B',      // Cyrillic В = B
  };
  return map[code] || code;
}

async function fetchAllQuestions(resourceId: string): Promise<RawRecord[]> {
  const records: RawRecord[] = [];
  let offset = 0;
  let total = Infinity;

  console.log(`Fetching questions from resource ${resourceId}...`);

  while (offset < total) {
    const url = `${API_BASE}?resource_id=${resourceId}&limit=${BATCH_SIZE}&offset=${offset}`;
    console.log(`  Fetching offset ${offset}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('API returned success: false');
    }

    total = data.result.total;
    records.push(...data.result.records);
    offset += BATCH_SIZE;
  }

  console.log(`  Fetched ${records.length} / ${total} records`);
  return records;
}

function processRecords(records: RawRecord[]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];

  for (const record of records) {
    if (!record.title2 || !record.description4) continue;

    // Extract question number from title2 (e.g., "1759. האם...")
    const numMatch = record.title2.match(/^(\d+)\.\s*/);
    if (!numMatch) continue;

    const questionNumber = numMatch[1];
    const questionText = record.title2.replace(/^\d+\.\s*/, '');

    const { answers, correctAnswerIndex, imageUrl, licenseTypes } = parseDescription(
      record.description4,
      questionNumber
    );

    if (answers.length === 0 || correctAnswerIndex === -1) continue;

    questions.push({
      id: `q_${questionNumber}`,
      questionNumber,
      text: questionText,
      answers,
      correctAnswerIndex,
      category: record.category || 'כללי',
      imageUrl,
      licenseTypes: licenseTypes.length > 0 ? licenseTypes : ['B'], // Default to B
    });
  }

  return questions;
}

async function main() {
  console.log('🚗 Fetching Israeli Driving Theory Questions...\n');

  const outputDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const [lang, resourceId] of Object.entries(RESOURCES)) {
    try {
      const records = await fetchAllQuestions(resourceId);
      const questions = processRecords(records);

      // Group by category for stats
      const categories = new Map<string, number>();
      const licenseStats = new Map<string, number>();

      for (const q of questions) {
        categories.set(q.category, (categories.get(q.category) || 0) + 1);
        for (const lt of q.licenseTypes) {
          licenseStats.set(lt, (licenseStats.get(lt) || 0) + 1);
        }
      }

      console.log(`\n📊 Stats for ${lang}:`);
      console.log(`  Total questions: ${questions.length}`);
      console.log(`  Categories:`);
      for (const [cat, count] of categories) {
        console.log(`    ${cat}: ${count}`);
      }
      console.log(`  License types:`);
      for (const [lt, count] of licenseStats) {
        console.log(`    ${lt}: ${count}`);
      }

      // Write to JSON file
      const outputFile = path.join(outputDir, `questions_${lang}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2), 'utf-8');
      console.log(`\n✅ Saved to ${outputFile}`);

      // Also create a metadata file
      const metaFile = path.join(outputDir, `questions_${lang}_meta.json`);
      fs.writeFileSync(metaFile, JSON.stringify({
        language: lang,
        totalQuestions: questions.length,
        fetchedAt: new Date().toISOString(),
        source: `https://data.gov.il`,
        resourceId,
        categories: Object.fromEntries(categories),
        licenseTypes: Object.fromEntries(licenseStats),
      }, null, 2), 'utf-8');

    } catch (error) {
      console.error(`❌ Error fetching ${lang}:`, error);
    }
  }

  console.log('\n🎉 Done!');
}

main().catch(console.error);
