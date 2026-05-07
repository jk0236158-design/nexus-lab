import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import os from 'os';

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || join(os.homedir(), '.shared-ops');

const DAEMON_DIR = join(SHARED_OPS_PATH, '_daemon');
const WATCHER_LOG = join(DAEMON_DIR, 'watcher.log');
const WATCHER_PID = join(DAEMON_DIR, 'watcher.pid');
const DISPATCH_LOG = join(DAEMON_DIR, 'aira_dispatch_log.jsonl');

const STALE_THRESHOLD_MS = 1000 * 60 * 30;

const SUPPRESS_PATTERN = /ZEN_DISPATCH_SUPPRESSED/;

export interface DispatchLogEvent {
  raw: string;
  parsed: Record<string, unknown> | null;
}

export interface WatcherStatus {
  pid: number | null;
  state: 'running' | 'stale' | 'down';
  suppressedCountToday: number;
  suppressedCountTotal: number;
  lastSuppressedAt: string | null;
  recentLogLines: string[];
  dispatchLogTailEvents: DispatchLogEvent[];
  lastLogModifiedAt: string | null;
  sources: {
    logPath: string;
    pidPath: string;
    dispatchLogPath: string;
  };
}

function todayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function readPid(): number | null {
  if (!existsSync(WATCHER_PID)) return null;
  try {
    const raw = readFileSync(WATCHER_PID, 'utf-8').trim();
    // pid file may be JSON ({"pid": 42160}) or plain number
    if (raw.startsWith('{')) {
      try {
        const obj = JSON.parse(raw) as Record<string, unknown>;
        const n = Number(obj.pid);
        if (!Number.isFinite(n) || n <= 0) return null;
        return n;
      } catch {
        return null;
      }
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  } catch {
    return null;
  }
}

export function getWatcherStatus(): WatcherStatus {
  const pid = readPid();
  let logRaw = '';
  let lastLogModifiedAt: string | null = null;

  if (existsSync(WATCHER_LOG)) {
    try {
      logRaw = readFileSync(WATCHER_LOG, 'utf-8');
      const stat = statSync(WATCHER_LOG);
      lastLogModifiedAt = new Date(stat.mtimeMs).toISOString();
    } catch {
      logRaw = '';
    }
  }

  const allLines = logRaw.split('\n').filter((l) => l.length > 0);
  const recentLogLines = allLines.slice(-30);

  const today = todayDateString();
  let suppressedTotal = 0;
  let suppressedToday = 0;
  let lastSuppressedAt: string | null = null;

  for (const line of allLines) {
    if (SUPPRESS_PATTERN.test(line)) {
      suppressedTotal += 1;
      const tsMatch = line.match(
        /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)/,
      );
      if (tsMatch) lastSuppressedAt = tsMatch[1];
      const dateMatch = line.match(/^\d{4}-\d{2}-\d{2}/);
      if (dateMatch && dateMatch[0] === today) {
        suppressedToday += 1;
      }
    }
  }

  let state: 'running' | 'stale' | 'down' = 'down';
  if (pid !== null && lastLogModifiedAt !== null) {
    const ageMs = Date.now() - new Date(lastLogModifiedAt).getTime();
    state = ageMs < STALE_THRESHOLD_MS ? 'running' : 'stale';
  } else if (pid !== null) {
    state = 'stale';
  }

  const dispatchLogTailEvents = readDispatchLogTail(20);

  return {
    pid,
    state,
    suppressedCountToday: suppressedToday,
    suppressedCountTotal: suppressedTotal,
    lastSuppressedAt,
    recentLogLines,
    dispatchLogTailEvents,
    lastLogModifiedAt,
    sources: {
      logPath: WATCHER_LOG,
      pidPath: WATCHER_PID,
      dispatchLogPath: DISPATCH_LOG,
    },
  };
}

function readDispatchLogTail(n: number): DispatchLogEvent[] {
  if (!existsSync(DISPATCH_LOG)) return [];
  let raw = '';
  try {
    raw = readFileSync(DISPATCH_LOG, 'utf-8');
  } catch {
    return [];
  }
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const tail = lines.slice(-n);
  const events: DispatchLogEvent[] = [];
  for (const line of tail) {
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(line) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
    events.push({ raw: line, parsed });
  }
  return events.reverse();
}

export const __internal = {
  WATCHER_LOG,
  WATCHER_PID,
  DISPATCH_LOG,
  DAEMON_DIR,
  todayDateString,
  STALE_THRESHOLD_MS,
};
