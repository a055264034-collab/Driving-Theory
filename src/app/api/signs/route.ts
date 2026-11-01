import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    const signsPath = path.join(process.cwd(), 'src', 'data', 'officialSigns.json');
    if (!fs.existsSync(signsPath)) {
      return NextResponse.json({ success: true, count: 0, signs: [] });
    }

    const signs = JSON.parse(fs.readFileSync(signsPath, 'utf-8'));
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let filtered = signs;
    if (category && category !== 'all' && category !== 'הכל') {
      filtered = filtered.filter((s: any) => s.categoryHe === category || s.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(q) ||
          s.code?.includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      signs: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
