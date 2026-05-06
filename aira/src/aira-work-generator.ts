/**
 * aira-work-generator.ts — Aira Work Supervisor v0: Work Generator 機能 (minimum viable form)
 *
 * 2026-05-06 起稿 (Iwa packet、Wave 1 期間 return content path)
 * spec: team_memory/zen/2026-05-04_zen_aira_work_supervisor_v0_spec.md
 * packet: ~/.shared-ops/inbox/2026-05-05_zen_iwa_aira_v0_remaining_3_functions_minimum_viable_packet.md
 *
 * 5/05 evening jun reform: Aira = 「active context 圧縮 engine」
 * Work Generator = next green work 3 個までに圧縮する役割。生 log ではなく digest form output。
 *
 * 5/06 minimum viable scope:
 *   - parseFailureEvents: aira_observer.log (JSONL) read + parse
 *   - generateNextGreenWork: failure type 別 routing で proposal を生成、最大 3 個に圧縮
 *   - appendProposals: proposals を markdown form で append
 *
 * 5/04 朝 reform (Pattern C cap 廃止) 連動: throttle type は削除、relational protocol で自然 throttle。
 *
 * Kai 10 軸 7 番反映: Work Generator は提案まで、Kai gate 後に Active Work 化。
 * Aira は Kai state を直接 mutate しない。全 proposal の needs_kai_gate field で明示。
 *
 * 5/06+ Phase 0 expand candidates:
 *   - pass^k stability sliding window 計算 (reliability type の閾値判定)
 *   - multi-source aggregation (Observer event log + denial counter + board snapshot 統合)
 *   - wide scope task pool 解析 (zen_today.md 「続行可能 next batch」 section parse)
 *   - proposal 重複 dedup (同一 source_event 由来の重複生成抑制)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { homedir } from 'node:os';

// ============================================================
// Types
// ============================================================

export type FailureType =
  | 'idle'        // Active Work 0 件で 30 min 以上経過
  | 'self_drive'  // 確認だけ run (file write / Edit 0 件)
  | 'trigger'     // poll trigger 失敗 (主 session 内 ritual で再 poll)
  | 'recovery'    // Tripwire stop 解除条件
  | 'escalate'    // jun + Kai cross-check ritual 候補
  | 'reliability'; // pass^k stability < 0.8 で per-step required 格下げ

export interface FailureEvent {
  ts: string;          // ISO 8601 timestamp
  type: FailureType;
  source: string;      // どの Observer source 由来か (zen_today / kai_status / log 等)
  evidence: string;    // 1-2 line summary (圧縮 form、raw log ではない)
  meta?: Record<string, unknown>;
}

export interface ParseOptions {
  logPath?: string;    // default ~/.shared-ops/_daemon/aira_observer.log
  since?: Date;        // optional time filter
}

export type ActionType =
  | 'wide_scope_pool_pick'
  | 'board_inbox_draft'
  | 'observer_repoll'
  | 'tripwire_unblock_propose'
  | 'cross_check_ritual'
  | 'per_step_required_downgrade';

export interface NextGreenWorkProposal {
  ts: string;            // 生成時刻 ISO
  source_event: FailureEvent;
  action_type: ActionType;
  description: string;   // 短い圧縮 form (1-3 line target、raw event ではなく digest)
  needs_kai_gate: boolean; // Kai gate 後 Active Work 化 (Kai 10 軸 7 番反映、Work Generator は提案まで)
  rationale: string;     // 1 line で「なぜこの action か」
}

export interface GenerateOptions {
  maxProposals?: number; // default 3 (圧縮 form 強制)
  generated_timestamp?: string; // optional override (test 用、default は now)
}

export interface AppendOptions {
  outputPath?: string;   // default ~/.shared-ops/state/aira_work_generator_proposals.md
}

/** 圧縮 default = 3 (Aira role reframe: active context 圧縮 engine) */
export const DEFAULT_MAX_PROPOSALS = 3;

const VALID_FAILURE_TYPES: ReadonlySet<FailureType> = new Set([
  'idle',
  'self_drive',
  'trigger',
  'recovery',
  'escalate',
  'reliability',
]);

// ============================================================
// Internal helpers
// ============================================================

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return p.replace(/^~/, homedir());
  }
  return p;
}

function defaultLogPath(): string {
  return expandHome('~/.shared-ops/_daemon/aira_observer.log');
}

function defaultProposalsPath(): string {
  return expandHome('~/.shared-ops/state/aira_work_generator_proposals.md');
}

/**
 * 1 line の JSONL を FailureEvent に parse。
 * malformed line は null を return (caller 側で skip)。
 */
function parseLine(line: string): FailureEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  const ts = obj.ts;
  const type = obj.type;
  const source = obj.source;
  const evidence = obj.evidence;

  if (typeof ts !== 'string') return null;
  if (typeof type !== 'string' || !VALID_FAILURE_TYPES.has(type as FailureType)) return null;
  if (typeof source !== 'string') return null;
  if (typeof evidence !== 'string') return null;

  const event: FailureEvent = {
    ts,
    type: type as FailureType,
    source,
    evidence,
  };

  if (typeof obj.meta === 'object' && obj.meta !== null) {
    event.meta = obj.meta as Record<string, unknown>;
  }

  return event;
}

/**
 * failure type → action_type routing。
 * Aira role reframe: 提案まで、Kai state は mutate しない。
 */
function routeFailureType(type: FailureType): {
  action_type: ActionType;
  description_template: string;
  rationale: string;
  needs_kai_gate: boolean;
} {
  switch (type) {
    case 'idle':
      return {
        action_type: 'wide_scope_pool_pick',
        description_template:
          'wide scope task pool から next candidate select (zen_today.md 「続行可能 next batch」 section 起源)',
        rationale: 'Active Work 0 件 idle 検出 → wide scope pool 自動 pick で空白回避',
        needs_kai_gate: false,
      };
    case 'self_drive':
      return {
        action_type: 'board_inbox_draft',
        description_template:
          'board / inbox 起稿 candidate (light path、manual review 前提)',
        rationale: '自走失敗連続 → board 起稿 candidate light path で external review 要請',
        needs_kai_gate: false,
      };
    case 'trigger':
      return {
        action_type: 'observer_repoll',
        description_template:
          'Aira Observer 再 poll trigger (主 session 内 ritual 化、別 session fire 呼ばない form)',
        rationale: 'poll trigger 失敗 → 主 session 内 ritual で再 poll、別 session fire 不要',
        needs_kai_gate: false,
      };
    case 'recovery':
      return {
        action_type: 'tripwire_unblock_propose',
        description_template:
          'Tripwire stop 解除条件 propose (Phase 3 boundary template 連動)',
        rationale: 'recovery 条件成立 candidate → Tripwire 解除 propose、jun 確認後 unblock',
        needs_kai_gate: false,
      };
    case 'escalate':
      return {
        action_type: 'cross_check_ritual',
        description_template:
          'jun + Kai cross-check ritual 起動 (board 起稿 candidate)',
        rationale: 'escalate 候補 → jun + Kai cross-check ritual で multi-perspective gate',
        needs_kai_gate: true,
      };
    case 'reliability':
      return {
        action_type: 'per_step_required_downgrade',
        description_template:
          '該当 task type を per-step required に格下げ propose (pass^k stability < 0.8)',
        rationale: 'reliability 低下 → per-step required 格下げで品質安定化',
        needs_kai_gate: true,
      };
  }
}

// ============================================================
// Export 1: parseFailureEvents
// ============================================================

/**
 * Aira Observer の event log (JSONL format) を read + parse。
 *
 * file 不在 / read error → empty array return (graceful degradation、throw しない)。
 * malformed line は skip (各 line 独立 parse)。
 * since filter が指定されていれば ISO 比較で時刻 filter 適用。
 */
export async function parseFailureEvents(opts: ParseOptions = {}): Promise<FailureEvent[]> {
  const path = expandHome(opts.logPath ?? defaultLogPath());

  let content: string;
  try {
    content = await readFile(path, 'utf-8');
  } catch {
    return [];
  }

  const events: FailureEvent[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const event = parseLine(line);
    if (!event) continue;

    if (opts.since) {
      const eventTime = Date.parse(event.ts);
      if (Number.isNaN(eventTime)) continue;
      if (eventTime < opts.since.getTime()) continue;
    }

    events.push(event);
  }

  return events;
}

// ============================================================
// Export 2: generateNextGreenWork
// ============================================================

/**
 * failure type 別 next green work template 生成、最大 3 個までに圧縮。
 *
 * Aira role reframe (5/05 evening jun): active context 圧縮 engine。
 * 多すぎる failure event を人間 / 実行 AI が扱える少量 (default 3) に圧縮する。
 *
 * 圧縮 strategy: 入力 events を新しい順 (ts 降順) に sort し、上位 maxProposals 件を採用。
 * 同 type の重複は許容 (Phase 0 expand で dedup 候補)。
 */
export function generateNextGreenWork(
  events: FailureEvent[],
  opts: GenerateOptions = {},
): NextGreenWorkProposal[] {
  const maxProposals = opts.maxProposals ?? DEFAULT_MAX_PROPOSALS;
  const generatedTs = opts.generated_timestamp ?? new Date().toISOString();

  if (events.length === 0) return [];
  if (maxProposals <= 0) return [];

  // 新しい順 sort (ts 降順)
  const sorted = [...events].sort((a, b) => {
    const at = Date.parse(a.ts);
    const bt = Date.parse(b.ts);
    if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
    if (Number.isNaN(at)) return 1;
    if (Number.isNaN(bt)) return -1;
    return bt - at;
  });

  const picked = sorted.slice(0, maxProposals);

  return picked.map((event) => {
    const route = routeFailureType(event.type);
    return {
      ts: generatedTs,
      source_event: event,
      action_type: route.action_type,
      description: route.description_template,
      needs_kai_gate: route.needs_kai_gate,
      rationale: route.rationale,
    };
  });
}

// ============================================================
// Export 3: appendProposals
// ============================================================

/**
 * proposals を markdown form で append。
 *
 * 1 proposal = 1 section、observer の incrementDenialCounter 同形 pattern (mkdir + writeFile)。
 * file 不在 → 新規作成、既存 → append (read + concat + write)。
 */
export async function appendProposals(
  proposals: NextGreenWorkProposal[],
  opts: AppendOptions = {},
): Promise<void> {
  if (proposals.length === 0) return;

  const path = expandHome(opts.outputPath ?? defaultProposalsPath());

  // 既存 content を read (不在なら empty)
  let existing = '';
  try {
    existing = await readFile(path, 'utf-8');
  } catch {
    existing = '';
  }

  const sections: string[] = [];
  for (const p of proposals) {
    sections.push(formatProposalSection(p));
  }

  const appendBlock = sections.join('\n');
  const newContent = existing.length > 0
    ? `${existing.endsWith('\n') ? existing : existing + '\n'}${appendBlock}`
    : appendBlock;

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, newContent, 'utf-8');
}

/**
 * 1 proposal を markdown section text に format。
 */
function formatProposalSection(p: NextGreenWorkProposal): string {
  const lines: string[] = [];
  lines.push(`## ${p.ts} — ${p.action_type} (needs_kai_gate=${p.needs_kai_gate})`);
  lines.push('');
  lines.push(`- source_event: ${p.source_event.type} @ ${p.source_event.source} (${p.source_event.ts})`);
  lines.push(`- evidence: "${p.source_event.evidence}"`);
  lines.push(`- description: ${p.description}`);
  lines.push(`- rationale: ${p.rationale}`);
  lines.push('');
  return lines.join('\n');
}
