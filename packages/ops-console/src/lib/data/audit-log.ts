import { existsSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';

// Yuino セキュリティ v0 axis 13a: Audit Log file-based JSONL (5/07 PM jun directive 「絶対妥協なし」)
// 「いつ何が起きたか全部記録」 = UI 操作 + AI 判断 + 実行結果を改ざんしにくい form で残す
// v0 = file-based JSONL (sqlite3 layer は v1 carry)、 月別 rotation

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || 'C:\\Users\\jk023\\.shared-ops';

const AUDIT_DIR = join(SHARED_OPS_PATH, '_audit');

export type AuditAction =
  | 'inbox.decide'
  | 'inbox.read'
  | 'board.write'
  | 'board.read'
  | 'decisions.write'
  | 'decisions.read'
  | 'yuino.publish'
  | 'unknown';

export interface AuditLogEntry {
  timestamp: string; // ISO 8601 UTC
  action: AuditAction;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | string;
  affected_files: string[];
  user_identity: string; // 'jun' | 'zen' | 'kai' | 'aira' | 'system'
  request_summary: string; // 短い要約 (full body は記録しない、 secret 漏洩防止)
  response_status: number;
  permission_level: 'read' | 'draft' | 'internal-execute' | 'external-execute' | 'unknown';
  evidence?: string; // 追加 evidence (任意)
}

function getCurrentMonthLogPath(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  return join(AUDIT_DIR, `ops-console-audit-${yyyy}-${mm}.jsonl`);
}

function ensureAuditDir(): void {
  if (!existsSync(AUDIT_DIR)) {
    try {
      mkdirSync(AUDIT_DIR, { recursive: true });
    } catch {
      // skip if mkdir fails (will fail at write time too)
    }
  }
}

/**
 * Audit log にエントリを append-only 記録する。
 * file-based JSONL (sqlite3 layer は v1 carry)。
 * 失敗しても throw しない (graceful degradation、 audit 記録失敗で main flow 止めない)。
 */
export function appendAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  ensureAuditDir();

  const logPath = getCurrentMonthLogPath();
  const line = JSON.stringify(fullEntry) + '\n';

  try {
    appendFileSync(logPath, line, { encoding: 'utf-8' });
  } catch {
    // graceful: audit 記録失敗で main flow 止めない、 但し console error は将来 implement
  }
}

/**
 * 指定月の audit log を全件 read。 不在で []。
 */
export function readAuditLog(year: number, month: number): AuditLogEntry[] {
  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const logPath = join(AUDIT_DIR, `ops-console-audit-${yyyy}-${mm}.jsonl`);

  if (!existsSync(logPath)) return [];

  let raw = '';
  try {
    raw = readFileSync(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  const entries: AuditLogEntry[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as AuditLogEntry;
      entries.push(obj);
    } catch {
      // skip malformed line
    }
  }
  return entries;
}

/**
 * 直近 n 件の audit log を読む (現在月 + 必要なら前月)。
 */
export function readRecentAuditLog(n: number = 50): AuditLogEntry[] {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  let entries = readAuditLog(currentYear, currentMonth);

  // 現在月で n 件未満なら前月も読む
  if (entries.length < n) {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevEntries = readAuditLog(prevYear, prevMonth);
    entries = [...prevEntries, ...entries];
  }

  return entries.slice(-n);
}

export const __internal = {
  AUDIT_DIR,
  getCurrentMonthLogPath,
};
