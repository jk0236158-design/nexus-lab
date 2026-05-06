/**
 * aira-evaluator.ts — Aira Work Supervisor v0: Evaluator 機能 (minimum viable form)
 *
 * 2026-05-06 起稿 (Iwa packet、Wave 1 期間 return content path)
 * spec: team_memory/zen/2026-05-04_zen_aira_work_supervisor_v0_spec.md
 * packet: ~/.shared-ops/inbox/2026-05-05_zen_iwa_aira_v0_remaining_3_functions_minimum_viable_packet.md
 *
 * 5/05 evening jun reform: Aira = 「active context 圧縮 engine」
 * Evaluator = capability map 軸の **evidence pointer + review-able tag** 付与 (Kai 10 軸 3 番反映)。
 * auto 分類を事実扱いせず、 confidence + review_tag を付した digest form で output。
 *
 * 5/06 PM minimum viable scope:
 *   - evaluateFailures: Observer state / counter / zen_today を読み failure judgment を生成
 *   - formatJudgments: judgments を markdown form (evidence_pointer + review_tag) に整形
 *   - appendFailureEventsLog: JSONL form を aira_failure_events.log に append
 *     (Work Generator parseFailureEvents の input source / Kagami QA pass 指摘の I/O contract reify)
 *   - appendJudgments: markdown form を aira_failure_judgments.md に append (human review / audit 用)
 *
 * I/O contract (Kagami QA pass 指摘で reify、 Evaluator → Work Generator chain):
 *   - Evaluator write target 1: ~/.shared-ops/_daemon/aira_failure_events.log (JSONL、 machine-readable)
 *   - Evaluator write target 2: ~/.shared-ops/state/aira_failure_judgments.md (markdown、 human review)
 *   - Work Generator parseFailureEvents は (1) を読む。 follow-up commit で defaultLogPath rewire 候補。
 *
 * 5/06+ Phase 0 expand candidates:
 *   - reliability 判定の pass^k stability sliding window 実装 (現状 stub、 history field 不在で skip)
 *   - trigger / recovery 判定の実装 (Tripwire 機能完遂後 + Observer event integration 後)
 *   - atomic write 改修 (Kagami 指摘済の write-rename pattern 連動)
 *   - thresholds の per-peer customization
 */

import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { homedir } from 'node:os';
import type { FailureType, FailureEvent } from './aira-work-generator.js';

// ============================================================
// Types
// ============================================================

export type Confidence = 'high' | 'medium' | 'low';

export type ReviewTag =
  | 'auto_pass'
  | 'human_review_recommended'
  | 'human_review_required';

export interface EvidencePointer {
  source_file: string;       // 例: ~/.shared-ops/status/aira_observer_state.md
  timestamp: string;         // source file 観測時刻 (ISO 8601 or fs mtime)
  extract: string;           // 1-3 line content extract (圧縮 form、 raw ではない)
}

export interface FailureJudgment {
  ts: string;                // ISO 8601 judgment 時刻
  type: FailureType;         // Work Generator の FailureType と共有
  confidence: Confidence;    // auto 分類を事実扱いしない form (Kai 10 軸 3 番)
  evidence_pointer: EvidencePointer;
  review_tag: ReviewTag;
  description: string;       // 1-2 line digest (圧縮 form、 raw state ではない)
}

export interface ObserverStateInput {
  state_path?: string;       // default ~/.shared-ops/status/aira_observer_state.md
  counter_path?: string;     // default ~/.shared-ops/_daemon/aira_observer_counter.json
  zen_today_path?: string;   // default ~/.shared-ops/status/zen_today.md
}

export interface EvaluationThresholds {
  idle_min_minutes: number;            // default 30
  self_drive_log_age_minutes: number;  // default 30
  denial_consecutive: number;          // default 5
  denial_accumulated: number;          // default 20
  pass_k_stability_threshold: number;  // default 0.8
}

export interface EvaluateOptions extends ObserverStateInput {
  now?: Date;                                  // optional override (test 用)
  thresholds?: Partial<EvaluationThresholds>;
}

export interface AppendOptions {
  judgmentsPath?: string;    // default ~/.shared-ops/state/aira_failure_judgments.md
}

export interface AppendEventsLogOptions {
  logPath?: string;          // default ~/.shared-ops/_daemon/aira_failure_events.log
}

export const DEFAULT_THRESHOLDS: EvaluationThresholds = {
  idle_min_minutes: 30,
  self_drive_log_age_minutes: 30,
  denial_consecutive: 5,
  denial_accumulated: 20,
  pass_k_stability_threshold: 0.8,
};

// ============================================================
// Internal helpers
// ============================================================

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return p.replace(/^~/, homedir());
  }
  return p;
}

function defaultStatePath(): string {
  return expandHome('~/.shared-ops/status/aira_observer_state.md');
}

function defaultCounterPath(): string {
  return expandHome('~/.shared-ops/_daemon/aira_observer_counter.json');
}

function defaultZenTodayPath(): string {
  return expandHome('~/.shared-ops/status/zen_today.md');
}

function defaultJudgmentsPath(): string {
  return expandHome('~/.shared-ops/state/aira_failure_judgments.md');
}

function defaultEventsLogPath(): string {
  return expandHome('~/.shared-ops/_daemon/aira_failure_events.log');
}

/**
 * 1-3 line content extract (graceful truncate、 raw state ではない圧縮 form)。
 */
function makeExtract(content: string, maxLines = 3, maxLen = 240): string {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const head = lines.slice(0, maxLines).join(' / ');
  if (head.length <= maxLen) return head;
  return head.slice(0, maxLen - 1) + '…';
}

interface ObserverStateParsed {
  zen_active_work_count: number | null;
  observed_timestamp: string | null;
  raw_extract: string;
}

function parseObserverStateMarkdown(content: string): ObserverStateParsed {
  let zenActiveWorkCount: number | null = null;
  let observedTimestamp: string | null = null;

  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const tsMatch = /^generated:\s*(.+)$/.exec(trimmed);
    if (tsMatch && observedTimestamp === null) {
      observedTimestamp = tsMatch[1].trim();
      continue;
    }
    const zenMatch = /^[-*]\s*Zen[\s:：]*([0-9]+)\s*件/.exec(trimmed);
    if (zenMatch && zenActiveWorkCount === null) {
      zenActiveWorkCount = Number.parseInt(zenMatch[1], 10);
      continue;
    }
  }

  return {
    zen_active_work_count: zenActiveWorkCount,
    observed_timestamp: observedTimestamp,
    raw_extract: makeExtract(content),
  };
}

interface CounterParsed {
  consecutive_denials: number | null;
  accumulated_denials: number | null;
  last_updated: string | null;
  pass_history: Array<{ pass: boolean }> | null;
  raw_extract: string;
}

function parseCounterJson(raw: string): CounterParsed {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      consecutive_denials: null,
      accumulated_denials: null,
      last_updated: null,
      pass_history: null,
      raw_extract: makeExtract(raw),
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      consecutive_denials: null,
      accumulated_denials: null,
      last_updated: null,
      pass_history: null,
      raw_extract: makeExtract(raw),
    };
  }

  const obj = parsed as Record<string, unknown>;

  const consecutive =
    typeof obj.consecutive_denials === 'number'
      ? (obj.consecutive_denials as number)
      : typeof obj.today_count === 'number'
        ? (obj.today_count as number)
        : null;
  const accumulated =
    typeof obj.accumulated_denials === 'number'
      ? (obj.accumulated_denials as number)
      : typeof obj.accumulated_count === 'number'
        ? (obj.accumulated_count as number)
        : null;
  const lastUpdated =
    typeof obj.last_updated === 'string' ? (obj.last_updated as string) : null;

  let passHistory: Array<{ pass: boolean }> | null = null;
  if (Array.isArray(obj.pass_history)) {
    const arr = obj.pass_history as unknown[];
    const filtered: Array<{ pass: boolean }> = [];
    for (const item of arr) {
      if (typeof item === 'object' && item !== null) {
        const it = item as Record<string, unknown>;
        if (typeof it.pass === 'boolean') {
          filtered.push({ pass: it.pass });
        }
      }
    }
    if (filtered.length > 0) passHistory = filtered;
  }

  const extract = `consecutive_denials: ${consecutive ?? 'n/a'}, accumulated_denials: ${accumulated ?? 'n/a'}`;

  return {
    consecutive_denials: consecutive,
    accumulated_denials: accumulated,
    last_updated: lastUpdated,
    pass_history: passHistory,
    raw_extract: extract,
  };
}

interface ZenTodayParsed {
  latest_progress_timestamp: string | null;
  recent_write_event_count: number;
  raw_extract: string;
}

function parseZenTodayMarkdown(content: string, today: Date): ZenTodayParsed {
  const lines = content.split('\n');
  let inProgressSection = false;
  let latestTimestamp: string | null = null;
  let writeBulletCount = 0;

  const isoRe = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:[+-]\d{2}:?\d{2}|Z)?)/;
  const hhmmRe = /\b(\d{1,2}):(\d{2})\b/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^##\s*(進捗ログ|Progress Log)/i.test(trimmed)) {
      inProgressSection = true;
      continue;
    }
    if (inProgressSection && /^##\s+/.test(trimmed)) {
      inProgressSection = false;
    }

    if (!inProgressSection) continue;
    if (!/^[-*]\s+.{3,}/.test(trimmed)) continue;

    writeBulletCount += 1;

    if (latestTimestamp === null) {
      const isoMatch = isoRe.exec(trimmed);
      if (isoMatch) {
        latestTimestamp = isoMatch[1];
        continue;
      }
      const hhmmMatch = hhmmRe.exec(trimmed);
      if (hhmmMatch) {
        const h = Number.parseInt(hhmmMatch[1], 10);
        const m = Number.parseInt(hhmmMatch[2], 10);
        if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
          const synth = new Date(today);
          synth.setHours(h, m, 0, 0);
          latestTimestamp = synth.toISOString();
        }
      }
    }
  }

  return {
    latest_progress_timestamp: latestTimestamp,
    recent_write_event_count: writeBulletCount,
    raw_extract: makeExtract(content),
  };
}

async function safeReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

async function safeMtime(path: string): Promise<Date | null> {
  try {
    const s = await stat(path);
    return s.mtime;
  } catch {
    return null;
  }
}

function diffMinutes(a: Date, b: Date): number {
  return (a.getTime() - b.getTime()) / 60000;
}

function reviewTagFor(type: FailureType): ReviewTag {
  switch (type) {
    case 'idle':
    case 'self_drive':
      return 'human_review_recommended';
    case 'escalate':
    case 'reliability':
      return 'human_review_required';
    case 'trigger':
    case 'recovery':
      return 'auto_pass';
  }
}

// ============================================================
// Export 1: evaluateFailures
// ============================================================

/**
 * Observer state / counter / zen_today を読み failure judgment を生成。
 *
 * judgment 種別 (minimum viable):
 *   - idle: Active Work 0 件 + state file が `now - idle_min_minutes` より古い
 *   - self_drive: zen_today 進捗ログ最新 entry が `now - self_drive_log_age_minutes` より古い + write event 0 件
 *   - escalate: counter consecutive >= 5 OR accumulated >= 20
 *   - reliability: pass_history field がある場合のみ計算 (default は無効化、 false positive 回避)
 *   - trigger / recovery: minimum viable では判定対象外、 常に空 (Phase 0 expand)
 *
 * 全 file 不在は graceful、 例外 throw せず 空配列 return。
 */
export async function evaluateFailures(
  opts: EvaluateOptions = {},
): Promise<FailureJudgment[]> {
  const now = opts.now ?? new Date();
  const thresholds: EvaluationThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(opts.thresholds ?? {}),
  };

  const statePath = opts.state_path ? expandHome(opts.state_path) : defaultStatePath();
  const counterPath = opts.counter_path ? expandHome(opts.counter_path) : defaultCounterPath();
  const zenTodayPath = opts.zen_today_path
    ? expandHome(opts.zen_today_path)
    : defaultZenTodayPath();

  const [stateContent, counterContent, zenTodayContent] = await Promise.all([
    safeReadFile(statePath),
    safeReadFile(counterPath),
    safeReadFile(zenTodayPath),
  ]);

  const judgments: FailureJudgment[] = [];
  const judgmentTs = now.toISOString();

  if (stateContent !== null) {
    const parsed = parseObserverStateMarkdown(stateContent);
    let observedDate: Date | null = null;
    if (parsed.observed_timestamp) {
      const t = Date.parse(parsed.observed_timestamp);
      if (!Number.isNaN(t)) observedDate = new Date(t);
    }
    if (!observedDate) {
      observedDate = await safeMtime(statePath);
    }

    const ageMinutes =
      observedDate !== null ? diffMinutes(now, observedDate) : null;

    if (
      parsed.zen_active_work_count !== null &&
      parsed.zen_active_work_count === 0 &&
      ageMinutes !== null &&
      ageMinutes >= thresholds.idle_min_minutes
    ) {
      judgments.push({
        ts: judgmentTs,
        type: 'idle',
        confidence: 'medium',
        evidence_pointer: {
          source_file: statePath,
          timestamp: observedDate.toISOString(),
          extract: `Active Work Zen: 0 件、 ${Math.round(ageMinutes)} min 経過 (threshold ${thresholds.idle_min_minutes} min)`,
        },
        review_tag: reviewTagFor('idle'),
        description: `Active Work 0 件で ${Math.round(ageMinutes)} min 経過、 idle threshold 超過`,
      });
    }
  }

  if (zenTodayContent !== null) {
    const parsed = parseZenTodayMarkdown(zenTodayContent, now);

    let latestDate: Date | null = null;
    if (parsed.latest_progress_timestamp) {
      const t = Date.parse(parsed.latest_progress_timestamp);
      if (!Number.isNaN(t)) latestDate = new Date(t);
    }
    if (!latestDate) {
      latestDate = await safeMtime(zenTodayPath);
    }

    const ageMinutes = latestDate !== null ? diffMinutes(now, latestDate) : null;

    if (
      ageMinutes !== null &&
      ageMinutes >= thresholds.self_drive_log_age_minutes &&
      parsed.recent_write_event_count === 0
    ) {
      judgments.push({
        ts: judgmentTs,
        type: 'self_drive',
        confidence: 'medium',
        evidence_pointer: {
          source_file: zenTodayPath,
          timestamp: latestDate.toISOString(),
          extract: `進捗ログ最終更新 ${Math.round(ageMinutes)} min 前、 write event 0 件 (threshold ${thresholds.self_drive_log_age_minutes} min)`,
        },
        review_tag: reviewTagFor('self_drive'),
        description: `自走 progress 停滞 ${Math.round(ageMinutes)} min、 write 0 件で self_drive 候補`,
      });
    }
  }

  if (counterContent !== null) {
    const parsed = parseCounterJson(counterContent);
    const cons = parsed.consecutive_denials ?? 0;
    const acc = parsed.accumulated_denials ?? 0;

    const consExceeded = cons >= thresholds.denial_consecutive;
    const accExceeded = acc >= thresholds.denial_accumulated;

    if (consExceeded || accExceeded) {
      const consClause = consExceeded
        ? `consecutive ${cons} >= ${thresholds.denial_consecutive}`
        : null;
      const accClause = accExceeded
        ? `accumulated ${acc} >= ${thresholds.denial_accumulated}`
        : null;
      const reasons = [consClause, accClause].filter((s): s is string => s !== null).join(' / ');

      judgments.push({
        ts: judgmentTs,
        type: 'escalate',
        confidence: 'high',
        evidence_pointer: {
          source_file: counterPath,
          timestamp: parsed.last_updated ?? judgmentTs,
          extract: parsed.raw_extract,
        },
        review_tag: reviewTagFor('escalate'),
        description: `denial threshold 超過 (${reasons})、 jun + Kai cross-check 候補`,
      });
    }

    if (parsed.pass_history && parsed.pass_history.length >= 5) {
      const window = parsed.pass_history.slice(-10);
      const passCount = window.filter((h) => h.pass).length;
      const stability = passCount / window.length;
      if (stability < thresholds.pass_k_stability_threshold) {
        judgments.push({
          ts: judgmentTs,
          type: 'reliability',
          confidence: 'medium',
          evidence_pointer: {
            source_file: counterPath,
            timestamp: parsed.last_updated ?? judgmentTs,
            extract: `pass_history window=${window.length}, stability=${stability.toFixed(2)} < ${thresholds.pass_k_stability_threshold}`,
          },
          review_tag: reviewTagFor('reliability'),
          description: `pass^k stability ${stability.toFixed(2)} で threshold 下回り、 per-step required 格下げ候補`,
        });
      }
    }
  }

  return judgments;
}

// ============================================================
// Export 2: formatJudgments
// ============================================================

/**
 * judgments を markdown form に整形。
 * evidence_pointer + review_tag + confidence を明示し、 auto 分類を事実扱いしない。
 */
export function formatJudgments(judgments: FailureJudgment[]): string {
  if (judgments.length === 0) return '';

  const sections: string[] = [];
  for (const j of judgments) {
    sections.push(formatJudgmentSection(j));
  }
  return sections.join('\n');
}

function formatJudgmentSection(j: FailureJudgment): string {
  const lines: string[] = [];
  lines.push(
    `## ${j.ts} — ${j.type} (confidence=${j.confidence}, review_tag=${j.review_tag})`,
  );
  lines.push('');
  lines.push(`- description: ${j.description}`);
  lines.push('- evidence_pointer:');
  lines.push(`  - source_file: ${j.evidence_pointer.source_file}`);
  lines.push(`  - timestamp: ${j.evidence_pointer.timestamp}`);
  lines.push(`  - extract: "${j.evidence_pointer.extract}"`);
  lines.push('');
  return lines.join('\n');
}

// ============================================================
// Export 3: appendFailureEventsLog (I/O contract reify)
// ============================================================

/**
 * judgment を JSONL form に変換し aira_failure_events.log に append。
 *
 * Work Generator parseFailureEvents の input source となる machine-readable form。
 * Kagami QA pass 指摘の I/O contract reify (Evaluator → Work Generator chain)。
 *
 * 出力 schema (FailureEvent 互換):
 *   { ts, type, source, evidence, meta: { confidence, review_tag } }
 */
export async function appendFailureEventsLog(
  judgments: FailureJudgment[],
  opts: AppendEventsLogOptions = {},
): Promise<void> {
  if (judgments.length === 0) return;

  const path = opts.logPath ? expandHome(opts.logPath) : defaultEventsLogPath();

  const lines: string[] = [];
  for (const j of judgments) {
    const event: FailureEvent = {
      ts: j.ts,
      type: j.type,
      source: j.evidence_pointer.source_file,
      evidence: j.evidence_pointer.extract,
      meta: {
        confidence: j.confidence,
        review_tag: j.review_tag,
        description: j.description,
      },
    };
    lines.push(JSON.stringify(event));
  }

  let existing = '';
  try {
    existing = await readFile(path, 'utf-8');
  } catch {
    existing = '';
  }

  const appendBlock = lines.join('\n') + '\n';
  const newContent = existing.length > 0
    ? `${existing.endsWith('\n') ? existing : existing + '\n'}${appendBlock}`
    : appendBlock;

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, newContent, 'utf-8');
}

// ============================================================
// Export 4: appendJudgments
// ============================================================

/**
 * judgments を markdown form で append (human review / audit 用)。
 * Work Generator appendProposals 同形 pattern (mkdir + writeFile、 atomic write は Phase 0 expand 候補)。
 */
export async function appendJudgments(
  judgments: FailureJudgment[],
  opts: AppendOptions = {},
): Promise<void> {
  if (judgments.length === 0) return;

  const path = opts.judgmentsPath
    ? expandHome(opts.judgmentsPath)
    : defaultJudgmentsPath();

  let existing = '';
  try {
    existing = await readFile(path, 'utf-8');
  } catch {
    existing = '';
  }

  const appendBlock = formatJudgments(judgments);
  const newContent = existing.length > 0
    ? `${existing.endsWith('\n') ? existing : existing + '\n'}${appendBlock}`
    : appendBlock;

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, newContent, 'utf-8');
}
