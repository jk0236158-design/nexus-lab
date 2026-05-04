/**
 * aira-observer.ts — Aira Work Supervisor v0: Observer 機能 (minimum viable form)
 *
 * 2026-05-05 起稿 (Iwa packet、Wave 1 期間 return content path)
 * spec: team_memory/zen/2026-05-04_zen_aira_work_supervisor_v0_spec.md
 * packet: ~/.shared-ops/inbox/2026-05-05_zen_iwa_aira_observer_first_build_packet.md
 *
 * 5/05 PM minimum viable scope:
 *   - pollInputSources: 3 source (zen_today.md / kai_status.md / board listing) poll
 *   - generateStateSnapshot: state → markdown state snapshot text
 *   - incrementDenialCounter: denial counter file increment + state return
 *
 * 既存 digest engine (digest-public.ts / input-public.ts / output-public.ts) とは orthogonal な
 * 新規 module。既存 file には一切 touch しない。
 *
 * 5/06+ Phase 0 expand candidates:
 *   - 6 source full (active_kai_work.json + kai_growth_mode.md + daemon log)
 *   - 7 event type full (idle / 自走 / trigger / recovery / throttle / reliability failure)
 *   - capability map 12 軸 measurement
 *   - cron 自動化 (10 min interval)
 */

import { readFile, readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';

// ============================================================
// Types
// ============================================================

export interface PollOptions {
  zen_today_path: string;  // e.g., ~/.shared-ops/status/zen_today.md
  kai_status_path: string; // e.g., ~/.shared-ops/status/kai_status.md
  board_dir: string;       // e.g., ~/.shared-ops/board/
  today_date: string;      // YYYY-MM-DD
}

export interface SnapshotOptions {
  phase: '0';              // minimum viable = "0"
  generated_timestamp: string; // ISO 8601
}

export interface CounterOptions {
  counter_file_path: string; // e.g., ~/.shared-ops/_daemon/aira_observer_counter.json
  peer_name: string;         // "zen" | "kai" | etc.
  event_timestamp: string;   // ISO 8601
}

export interface InputSourceState {
  zen_active_work_count: number;
  kai_active_work_count: number;
  today_board_count: number;
  today_board_total_size: number;
  confirmation_only_run_detected: boolean; // 軸 2: 確認だけ run 検出
  counter_state: DenialCounterState | null; // null = counter file not yet read
  raw: {
    zen_today_content: string | null;
    kai_status_content: string | null;
    board_files: string[];
    poll_errors: string[];
  };
}

/** Auto Mode 閾値: 5 日連続 or 3 日以内累計 20 件で escalate */
export const AUTO_MODE_THRESHOLD_CONSECUTIVE = 5;
export const AUTO_MODE_THRESHOLD_ACCUMULATED = 20;

export interface DenialCounterState {
  today_count: number;
  accumulated_count: number;
  auto_mode_status: 'within' | 'exceeded';
  escalate_notice: boolean;
  last_updated: string;
  peer_name: string;
}

// ============================================================
// Internal helpers
// ============================================================

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return p.replace(/^~/, homedir());
  }
  return p;
}

/**
 * zen_today.md の進捗ログ section から active work 件数を抽出。
 *
 * 期待 pattern: 「## 進捗ログ」セクション内の「- 」行を active work として数える。
 * 「sweep 完了 + 着手 0 件」pattern を confirmation_only_run として検出。
 */
function parseZenTodayContent(content: string): {
  active_work_count: number;
  confirmation_only_run: boolean;
} {
  const lines = content.split('\n');

  let inProgressSection = false;
  let workLineCount = 0;
  let hasSweep = false;
  let hasZeroStart = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Section detection
    if (/^##\s*(進捗ログ|Progress Log)/i.test(trimmed)) {
      inProgressSection = true;
      continue;
    }
    if (inProgressSection && /^##\s+/.test(trimmed)) {
      inProgressSection = false;
    }

    if (inProgressSection) {
      // Count bullet items as active work entries
      if (/^[-*]\s+.{3,}/.test(trimmed)) {
        workLineCount += 1;
      }
      // Detect "sweep 完了 + 着手 0 件" pattern
      if (/sweep/.test(trimmed) || /スタートアップ|startup/i.test(trimmed)) {
        hasSweep = true;
      }
      if (/着手[\s:：]*0|0[\s件]*(着手|start)|zero.*(start|task)|start.*zero/i.test(trimmed)) {
        hasZeroStart = true;
      }
    }
  }

  // If no progress section found, count all "- " bullet lines as fallback
  if (workLineCount === 0) {
    const bulletLines = lines.filter((l) => /^\s*[-*]\s+.{3,}/.test(l));
    workLineCount = Math.min(bulletLines.length, 20); // cap at 20 to avoid false positives
  }

  const confirmation_only_run = hasSweep && (hasZeroStart || workLineCount === 0);

  return {
    active_work_count: workLineCount,
    confirmation_only_run,
  };
}

/**
 * kai_status.md から Kai の active work 件数を抽出。
 *
 * 期待 pattern: 「## 当日 status」「## Today Status」「## Active」セクション内の「- 」行を数える。
 * セクションがない場合はトップレベルの bullet 行を集計。
 */
function parseKaiStatusContent(content: string): { active_work_count: number } {
  const lines = content.split('\n');

  let inActiveSection = false;
  let workLineCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^##\s*(当日\s*status|Today\s*Status|Active|active_work|現在|Current)/i.test(trimmed)) {
      inActiveSection = true;
      continue;
    }
    if (inActiveSection && /^##\s+/.test(trimmed)) {
      inActiveSection = false;
    }

    if (inActiveSection && /^[-*]\s+.{3,}/.test(trimmed)) {
      workLineCount += 1;
    }
  }

  // Fallback: count all bullet lines if no section found
  if (workLineCount === 0) {
    const bulletLines = lines.filter((l) => /^\s*[-*]\s+.{3,}/.test(l));
    workLineCount = Math.min(bulletLines.length, 20);
  }

  return { active_work_count: workLineCount };
}

/**
 * board dir をスキャンして今日起稿のファイル一覧 + 総 size を取得。
 *
 * today_date prefix (YYYY-MM-DD) に一致する file を today's board files として集計。
 */
async function pollBoardDir(
  boardDir: string,
  todayDate: string,
): Promise<{ today_files: string[]; total_size: number; error: string | null }> {
  const expanded = expandHome(boardDir);
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(expanded, { withFileTypes: true });
  } catch (err) {
    return { today_files: [], total_size: 0, error: `board dir read error: ${(err as Error).message}` };
  }

  const todayFiles: string[] = [];
  let totalSize = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.startsWith(todayDate)) continue;

    const fullPath = join(expanded, entry.name);
    todayFiles.push(fullPath);

    try {
      const s = await stat(fullPath);
      totalSize += s.size;
    } catch {
      // size 取得失敗は無視 (ファイル存在のみ記録)
    }
  }

  return { today_files: todayFiles, total_size: totalSize, error: null };
}

// ============================================================
// Export 1: pollInputSources
// ============================================================

/**
 * 3 source (zen_today.md / kai_status.md / board listing) を poll し InputSourceState を返す。
 *
 * Input file 不在 / parse error は error として raw.poll_errors に記録し、
 * count は 0 として処理を継続する (abort しない)。
 */
export async function pollInputSources(opts: PollOptions): Promise<InputSourceState> {
  const pollErrors: string[] = [];

  // --- Source 1: zen_today.md ---
  let zenTodayContent: string | null = null;
  let zenActiveWorkCount = 0;
  let confirmationOnlyRun = false;

  try {
    const path = expandHome(opts.zen_today_path);
    zenTodayContent = await readFile(path, 'utf-8');
    const parsed = parseZenTodayContent(zenTodayContent);
    zenActiveWorkCount = parsed.active_work_count;
    confirmationOnlyRun = parsed.confirmation_only_run;
  } catch (err) {
    pollErrors.push(`zen_today.md not found or unreadable: ${(err as Error).message}`);
  }

  // --- Source 2: kai_status.md ---
  let kaiStatusContent: string | null = null;
  let kaiActiveWorkCount = 0;

  try {
    const path = expandHome(opts.kai_status_path);
    kaiStatusContent = await readFile(path, 'utf-8');
    const parsed = parseKaiStatusContent(kaiStatusContent);
    kaiActiveWorkCount = parsed.active_work_count;
  } catch (err) {
    pollErrors.push(`kai_status.md not found or unreadable: ${(err as Error).message}`);
  }

  // --- Source 3: board listing ---
  let boardFiles: string[] = [];
  let boardTotalSize = 0;

  const boardResult = await pollBoardDir(opts.board_dir, opts.today_date);
  if (boardResult.error) {
    pollErrors.push(boardResult.error);
  } else {
    boardFiles = boardResult.today_files;
    boardTotalSize = boardResult.total_size;
  }

  return {
    zen_active_work_count: zenActiveWorkCount,
    kai_active_work_count: kaiActiveWorkCount,
    today_board_count: boardFiles.length,
    today_board_total_size: boardTotalSize,
    confirmation_only_run_detected: confirmationOnlyRun,
    counter_state: null,
    raw: {
      zen_today_content: zenTodayContent,
      kai_status_content: kaiStatusContent,
      board_files: boardFiles,
      poll_errors: pollErrors,
    },
  };
}

// ============================================================
// Export 2: generateStateSnapshot
// ============================================================

/**
 * InputSourceState から markdown 形式の state snapshot text を生成して返す。
 *
 * 出力先への write は呼び出し側が担当 (本 module は text 生成のみ)。
 * これにより output-public.ts 等の write layer と責務を分離する。
 */
export function generateStateSnapshot(state: InputSourceState, opts: SnapshotOptions): string {
  const date = opts.generated_timestamp.slice(0, 10);
  const lines: string[] = [];

  lines.push('---');
  lines.push(`generated: ${opts.generated_timestamp}`);
  lines.push('generated_by: aira-observer.ts');
  lines.push(`phase: ${opts.phase} (minimum viable)`);
  lines.push('input_sources: 3');
  lines.push('---');
  lines.push('');
  lines.push(`# Aira Observer State (${date})`);
  lines.push('');

  // Active Work 件数 (capability map 軸 1)
  lines.push('## Active Work 件数');
  lines.push(`- Zen: ${state.zen_active_work_count} 件 (zen_today.md の進捗ログから抽出)`);
  lines.push(`- Kai: ${state.kai_active_work_count} 件 (kai_status.md から抽出)`);
  lines.push('');

  // Today 起稿件数 (board)
  lines.push('## Today 起稿件数 (board)');
  lines.push(`- 件数: ${state.today_board_count}`);
  lines.push(`- 総 size: ${state.today_board_total_size} bytes`);
  lines.push('');

  // 確認だけ run 検出 (capability map 軸 2)
  lines.push('## 確認だけで終わった run 検出 (capability map 軸 2 連動)');
  lines.push(`- detection result: ${state.confirmation_only_run_detected ? 'yes' : 'no'}`);
  lines.push('- detection logic: zen_today.md 進捗ログに「sweep 完了 + 着手 0 件」 pattern grep');
  lines.push('');

  // Denial counter
  lines.push('## physical denial counter (subagent write denial 累計)');
  if (state.counter_state) {
    const cs = state.counter_state;
    lines.push(`- today: ${cs.today_count}`);
    lines.push(`- accumulated: ${cs.accumulated_count}`);
    lines.push(`- Auto Mode 5/3 連続閾値: ${cs.auto_mode_status}`);
    lines.push(`- escalate notice: ${cs.escalate_notice ? 'yes' : 'no'}`);
  } else {
    lines.push('- today: (counter not loaded)');
    lines.push('- accumulated: (counter not loaded)');
    lines.push('- Auto Mode 5/3 連続閾値: (counter not loaded)');
    lines.push('- escalate notice: no');
  }
  lines.push('');

  // Poll errors
  if (state.raw.poll_errors.length > 0) {
    lines.push('## Poll Errors');
    for (const e of state.raw.poll_errors) {
      lines.push(`- ${e}`);
    }
    lines.push('');
  }

  // Failure Detection Events
  lines.push('## Failure Detection Events (今日)');
  lines.push('(本 minimum viable form では physical denial counter event のみ)');

  return lines.join('\n');
}

// ============================================================
// Export 3: incrementDenialCounter
// ============================================================

/**
 * denial counter file をインクリメントして DenialCounterState を返す。
 *
 * counter file 不在の場合は初期状態 (0 件) から起算する。
 * concurrent write のリスクを最小化するため read → mutate → write を同期的に行う
 * (Node.js single-thread 特性を活用、OS-level file lock は使用しない)。
 *
 * counter file schema:
 * {
 *   today_date: "YYYY-MM-DD",
 *   today_count: number,
 *   accumulated_count: number,
 *   last_updated: ISO string,
 *   peer_name: string
 * }
 */
export async function incrementDenialCounter(opts: CounterOptions): Promise<DenialCounterState> {
  const counterPath = expandHome(opts.counter_file_path);
  const todayDate = opts.event_timestamp.slice(0, 10);

  // Read existing counter (or start from zero)
  let raw: {
    today_date: string;
    today_count: number;
    accumulated_count: number;
    last_updated: string;
    peer_name: string;
  } = {
    today_date: todayDate,
    today_count: 0,
    accumulated_count: 0,
    last_updated: opts.event_timestamp,
    peer_name: opts.peer_name,
  };

  try {
    const existing = await readFile(counterPath, 'utf-8');
    const parsed = JSON.parse(existing);
    raw = { ...raw, ...parsed };
  } catch {
    // File not found or parse error → use initial zero state
  }

  // Reset today_count if date changed (new day)
  if (raw.today_date !== todayDate) {
    raw.today_date = todayDate;
    raw.today_count = 0;
  }

  // Increment
  raw.today_count += 1;
  raw.accumulated_count += 1;
  raw.last_updated = opts.event_timestamp;
  raw.peer_name = opts.peer_name;

  // Evaluate Auto Mode status
  const autoModeExceeded =
    raw.today_count >= AUTO_MODE_THRESHOLD_CONSECUTIVE ||
    raw.accumulated_count >= AUTO_MODE_THRESHOLD_ACCUMULATED;

  // Write back (mkdir if needed)
  try {
    await mkdir(dirname(counterPath), { recursive: true });
    await writeFile(counterPath, JSON.stringify(raw, null, 2), 'utf-8');
  } catch (err) {
    // Write failure: return computed state anyway (state is still valid in-memory)
    // Caller can log the write failure
    const state: DenialCounterState = {
      today_count: raw.today_count,
      accumulated_count: raw.accumulated_count,
      auto_mode_status: autoModeExceeded ? 'exceeded' : 'within',
      escalate_notice: autoModeExceeded,
      last_updated: raw.last_updated,
      peer_name: raw.peer_name,
    };
    return state;
  }

  return {
    today_count: raw.today_count,
    accumulated_count: raw.accumulated_count,
    auto_mode_status: autoModeExceeded ? 'exceeded' : 'within',
    escalate_notice: autoModeExceeded,
    last_updated: raw.last_updated,
    peer_name: raw.peer_name,
  };
}
