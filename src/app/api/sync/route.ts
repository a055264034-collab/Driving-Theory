import { NextRequest, NextResponse } from 'next/server';
import { syncQuestions } from '@/lib/syncService';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const metaPath = path.join(process.cwd(), 'src', 'data', 'questions_he_meta.json');
    let meta = null;
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    return NextResponse.json({
      success: true,
      lastSync: meta,
      message: 'Use POST to trigger a new sync from data.gov.il',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await syncQuestions();
    return NextResponse.json({
      success: true,
      message: 'Questions synced successfully from data.gov.il',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Sync failed',
      },
      { status: 500 }
    );
  }
}
