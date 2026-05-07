import { NextResponse } from 'next/server';
import { getYuinoDigestList } from '@/lib/data/yuino-digest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface DigestListResponse {
  ok: true;
  count: number;
  items: Array<{ filename: string; date: string }>;
}

export async function GET(): Promise<NextResponse<DigestListResponse>> {
  const list = getYuinoDigestList();
  return NextResponse.json(
    {
      ok: true,
      count: list.length,
      items: list.map((e) => ({ filename: e.filename, date: e.date })),
    },
    { status: 200 },
  );
}
