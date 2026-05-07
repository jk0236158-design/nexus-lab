import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

// path 修正 (5/07 朝 detect): nokaze-aira/data/ ではなく ~/.shared-ops/ state side
// Kai-side daemon (5/07 朝 deployment) が ~/.shared-ops/status/ + ~/.shared-ops/_daemon/ に generate する
const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || 'C:\\Users\\jk023\\.shared-ops';

const STATUS_FILE = join(SHARED_OPS_PATH, 'status', 'aira_closed_loop_status.md');
const LOG_FILE = join(SHARED_OPS_PATH, '_daemon', 'aira_dispatch_log.jsonl');

export const CLOSED_LOOP_STEPS = [
  'observe',
  'decide',
  'dispatch',
  'verify',
  'recover',
  'execute',
] as const;

export type ClosedLoopStep = (typeof CLOSED_LOOP_STEPS)[number];

export interface ClosedLoopEvent {
  timestamp: string;
  step: ClosedLoopStep | string;
  status: 'ok' | 'fail' | 'skip' | string;
  evidence?: string;
  raw?: string;
}

export interface ClosedLoopStatus {
  status: string;
  lastRunAt: string | null;
  recentEvents: ClosedLoopEvent[];
  falsePositiveCount: number;
  falseNegativeCount: number;
  lastResetAt: string | null;
  sources: { statusPath: string; logPath: string };
}

export function getAiraClosedLoopStatus(): ClosedLoopStatus {
  let statusText = '';
  let lastRunAt: string | null = null;

  if (existsSync(STATUS_FILE)) {
    try {
      statusText = readFileSync(STATUS_FILE, 'utf-8');
      const stat = statSync(STATUS_FILE);
      lastRunAt = new Date(stat.mtimeMs).toISOString();
    } catch {
      statusText = '';
    }
  }

  const recentEvents = getAiraClosedLoopLogTail(50);

  return {
    status: statusText || '(closed_loop_status.md is not present yet)',
    lastRunAt,
    recentEvents,
    falsePositiveCount: 0,
    falseNegativeCount: 0,
    lastResetAt: null,
    sources: { statusPath: STATUS_FILE, logPath: LOG_FILE },
  };
}

export function getAiraClosedLoopLogTail(n: number = 50): ClosedLoopEvent[] {
  if (n <= 0) return [];
  if (!existsSync(LOG_FILE)) return [];
  let raw = '';
  try {
    raw = readFileSync(LOG_FILE, 'utf-8');
  } catch {
    return [];
  }
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const tail = lines.slice(-n);
  const events: ClosedLoopEvent[] = [];
  for (const line of tail) {
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      events.push({
        timestamp: String(obj.timestamp ?? obj.recorded_at ?? obj.created_at ?? ''),
        step: String(obj.step ?? obj.action_type ?? 'unknown'),
        status: String(obj.status ?? 'unknown'),
        evidence: obj.evidence ? String(obj.evidence) : (obj.board_path ? String(obj.board_path) : undefined),
        raw: line,
      });
    } catch {
      // skip malformed line
    }
  }
  return events.reverse();
}

export function summarizeStepStatuses(
  events: ClosedLoopEvent[],
): Record<string, { lastTimestamp: string; lastStatus: string } | null> {
  const result: Record<string, { lastTimestamp: string; lastStatus: string } | null> = {};
  for (const step of CLOSED_LOOP_STEPS) {
    result[step] = null;
  }
  for (const ev of events) {
    if (!result[ev.step] || result[ev.step] === null) {
      result[ev.step] = {
        lastTimestamp: ev.timestamp,
        lastStatus: ev.status,
      };
    }
  }
  return result;
}

export const __internal = {
  STATUS_FILE,
  LOG_FILE,
  SHARED_OPS_PATH,
};
