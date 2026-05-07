import { NextResponse } from 'next/server';
import { getWatcherStatus } from '@/lib/data/watcher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const status = getWatcherStatus();
  return NextResponse.json(
    {
      ok: true,
      pid: status.pid,
      state: status.state,
      suppressedCountToday: status.suppressedCountToday,
      suppressedCountTotal: status.suppressedCountTotal,
      lastSuppressedAt: status.lastSuppressedAt,
      lastLogModifiedAt: status.lastLogModifiedAt,
      recentLogLines: status.recentLogLines,
      dispatchLogTailEvents: status.dispatchLogTailEvents.map(
        (e) => e.parsed ?? { raw: e.raw },
      ),
      sources: status.sources,
    },
    { status: 200 },
  );
}
