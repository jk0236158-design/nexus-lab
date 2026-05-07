import { NextResponse } from 'next/server';
import {
  getAiraClosedLoopStatus,
  summarizeStepStatuses,
} from '@/lib/data/aira-closed-loop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const status = getAiraClosedLoopStatus();
  const steps = summarizeStepStatuses(status.recentEvents);

  return NextResponse.json(
    {
      ok: true,
      lastRunAt: status.lastRunAt,
      lastResetAt: status.lastResetAt,
      falsePositiveCount: status.falsePositiveCount,
      falseNegativeCount: status.falseNegativeCount,
      steps,
      recentEvents: status.recentEvents.map((ev) => ({
        timestamp: ev.timestamp,
        step: String(ev.step),
        status: String(ev.status),
        evidence: ev.evidence,
      })),
      sources: status.sources,
    },
    { status: 200 },
  );
}
