export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { runChart } from '@/lib/chart';
import { saveChart, cleanupOldFiles } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month, day, hour, minute, gender, isLunar } = body;

    if (year === undefined || year === null || month === undefined || month === null || day === undefined || day === null || hour === undefined || minute === undefined || !gender) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: 'year, month, day, hour, minute, gender',
        received: { year, month, day, hour, minute, gender },
      }, { status: 400 });
    }

    const birthInfo = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      gender: gender === 'male' ? 'male' as const : 'female' as const,
      isLunar: isLunar === true,
    };

    console.log('[chart API] generating chart for', { year, month, day, hour, gender });

    const result = runChart(birthInfo);

    console.log('[chart API] chart generated, keys:', Object.keys(result.json || {}).join(','));

    const id = crypto.randomUUID().slice(0, 8);

    saveChart(id, {
      birthInfo,
      chart: result.json,
      chartText: result.text,
      createdAt: Date.now(),
    });

    try { cleanupOldFiles(); } catch {}

    return NextResponse.json({ id, chart: result.json });
  } catch (err: any) {
    const msg = err.message || 'Failed to generate chart';
    console.error('[chart API] error:', msg);
    console.error('[chart API] stack:', err.stack?.split('\n').slice(0, 5).join('\n'));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
