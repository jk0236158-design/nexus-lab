import { NextRequest, NextResponse } from 'next/server';
import { getYuinoDigestByDate } from '@/lib/data/yuino-digest';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface DigestDetailSuccess {
  ok: true;
  digest: {
    filename: string;
    date: string;
    content: string;
    contradictionNotes: string[];
    waitObservations: string[];
    sourcePath: string;
  };
}

export interface DigestDetailError {
  ok: false;
  error: string;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ date: string }> },
): Promise<NextResponse<DigestDetailSuccess | DigestDetailError>> {
  const { date } = await context.params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { ok: false, error: 'date は YYYY-MM-DD 形式で指定してください' },
      { status: 400 },
    );
  }

  const digest = getYuinoDigestByDate(date);
  if (!digest) {
    return NextResponse.json(
      { ok: false, error: `${date} の digest が見つかりません` },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, digest }, { status: 200 });
}
