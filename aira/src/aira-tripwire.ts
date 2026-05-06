/**
 * aira-tripwire.ts — Aira Work Supervisor v0: Tripwire 機能 (minimum viable form)
 *
 * 2026-05-06 起稿 (Iwa packet、 Wave 1 期間 return content path)
 * spec: team_memory/zen/2026-05-04_zen_aira_work_supervisor_v0_spec.md
 * packet: ~/.shared-ops/inbox/2026-05-05_zen_iwa_aira_v0_remaining_3_functions_minimum_viable_packet.md
 *
 * 5/05 evening jun reform: Aira = 「active context 圧縮 engine」
 * Tripwire = Red gate 検出のみ通過、 Yellow / Green は label only。
 * 4-gate-types は Phase 3 = 5/27-5/31 で core rewrite、 minimum viable は label only form。
 * 「装置を増やすが、 増やしすぎない」 reform 連動 (議題 27/28 ナギ + ノト 反応)。
 *
 * 5/06 PM minimum viable scope:
 *   - scanForTripwireTargets: 5 target_type の keyword grep + boundary template 連動
 *   - enforceTripwire: blocking / escalating 発火時に audit log + jun approval inbox 起票
 *   - categorizeWithGate: 4-gate-types label 付与 (label only、 enforcement は blocking + escalating のみ)
 *   - scanJudgmentsForTripwire: Evaluator FailureJudgment 経由の chain (I/O contract、 Kai 10 軸 9 番反映)
 *
 * 5/06+ Phase 0 expand candidates:
 *   - 4-gate-types core 実装 (advisory / validating の enforcement 化、 Phase 3 = 5/27-5/31)
 *   - boundary template 連動の正規 keyword DB (現状 in-source defaults)
 *   - jun approval inbox follow-up workflow (decision 反映 → resume 自動化)
 *   - atomic write 改修連動 (Kagami 指摘済 write-rename pattern、 Evaluator と同じ axis)
 *   - Vending-Bench self-application Tripwire (公開 claim 検出の Phase 3 自走)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { FailureJudgment } from './aira-evaluator.js';

// ============================================================
// Types
// ============================================================

export type TripwireTargetType =
  | 'external_post'      // 外部投稿 (note / Zenn / X / 公開 docs publish)
  | 'mail_form_send'     // メール / form 送信
  | 'payment_contract'   // 支払い / 契約 / 価格公開
  | 'public_claim'       // 公開 claim (誇張禁止 + dogfood verify 後の publish)
  | 'private_nia_leak';  // private Nia material 露出

export type GateCategory =
  | 'advisory'    // label only (Phase 1)
  | 'validating'  // label only (Phase 1)
  | 'blocking'    // enforcement あり (即停止 + jun approval 待ち)
  | 'escalating'; // enforcement あり (即停止 + jun + Kai cross-check 起動)

export interface TripwireMatch {
  ts: string;                  // ISO 8601 detect 時刻
  target_type: TripwireTargetType;
  matched_keyword: string;     // 検出 keyword / pattern
  source: string;              // 検出 source (file path or context string)
  excerpt: string;             // 1-3 line content extract (圧縮 form)
  gate_category: GateCategory;
}

export interface TripwirePattern {
  target_type: TripwireTargetType;
  gate_category: GateCategory;
  keywords: string[];          // case-insensitive substring match
}

export interface ScanOptions {
  source?: string;             // optional context tag (default 'unknown')
  patterns?: TripwirePattern[]; // optional override (test 用)
  now?: Date;                  // optional override (test 用、 deterministic ts)
}

export interface EnforceOptions {
  inboxPath?: string;          // default ~/.shared-ops/inbox/
  logPath?: string;            // default ~/.shared-ops/_daemon/aira_tripwire.log
  now?: Date;
  approvalTopic?: string;      // jun approval inbox file 名 element
}

export interface EnforceResult {
  blocked: boolean;            // true なら enforcement 発火 (blocking / escalating)
  approval_inbox_path: string | null; // jun approval 起票 file path (発火時のみ)
  audit_log_appended: boolean;
  notes: string[];             // human-readable notes (debug / audit)
}

export interface GateCategorization {
  by_category: Record<GateCategory, TripwireMatch[]>;
  blocking_count: number;
  escalating_count: number;
  total_count: number;
}

// ============================================================
// Default patterns (Phase 1 minimum viable)
// ============================================================

export const DEFAULT_PATTERNS: TripwirePattern[] = [
  {
    target_type: 'external_post',
    gate_category: 'blocking',
    keywords: [
      'zenn publish',
      'zenn 公開',
      'note 公開',
      'note 投稿',
      'X 投稿',
      'tweet',
      'github public release',
      'npm publish',
      'booth publish',
      'gumroad publish',
    ],
  },
  {
    target_type: 'mail_form_send',
    gate_category: 'blocking',
    keywords: [
      'email send',
      'メール送信',
      'form 送信',
      'form submit',
      'mailto',
    ],
  },
  {
    target_type: 'payment_contract',
    gate_category: 'escalating',
    keywords: [
      'polar.sh',
      '代替決済',
      '価格公開',
      'paid plan',
      'subscription',
      '契約',
      'invoice',
      'gumroad price',
      '価格設定',
    ],
  },
  {
    target_type: 'public_claim',
    gate_category: 'blocking',
    keywords: [
      '北極星達成',
      '完成しました',
      '完了しました',
      'リリース完了',
      'production ready',
      'ヶ月運用',
      '正式リリース',
      '本格 publish',
    ],
  },
  {
    target_type: 'private_nia_leak',
    gate_category: 'escalating',
    keywords: [
      'Desktop/project-nia',
      'AI_Buddy_backup',
      'nia 内部',
      'Nia source',
      'nia/private',
      'aibuddy_',
    ],
  },
];

// ============================================================
// Internal helpers
// ============================================================

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return p.replace(/^~/, homedir());
  }
  return p;
}

function defaultInboxDir(): string {
  return expandHome('~/.shared-ops/inbox');
}

function defaultLogPath(): string {
  return expandHome('~/.shared-ops/_daemon/aira_tripwire.log');
}

/**
 * keyword 周辺 1-3 line の content extract (Aira 圧縮 form)。
 */
function makeExcerpt(content: string, keywordIndex: number, keyword: string): string {
  const start = Math.max(0, keywordIndex - 80);
  const end = Math.min(content.length, keywordIndex + keyword.length + 80);
  let raw = content.slice(start, end);
  raw = raw.replace(/\s+/g, ' ').trim();
  if (raw.length > 240) {
    raw = raw.slice(0, 239) + '…';
  }
  return raw;
}

function findKeywordIndex(haystack: string, needle: string): number {
  return haystack.toLowerCase().indexOf(needle.toLowerCase());
}

function isoFromOpts(now: Date | undefined): string {
  return (now ?? new Date()).toISOString();
}

// ============================================================
// Export 1: scanForTripwireTargets
// ============================================================

/**
 * content を 5 target_type の keyword に対し case-insensitive で grep し、
 * match した keyword 周辺 1-3 line extract を `TripwireMatch[]` で返す。
 *
 * 空 array 可、 throw しない graceful。 同一 keyword の複数 match は first match のみ
 * (圧縮 form 強制、 raw event 列挙ではない)。
 */
export function scanForTripwireTargets(
  content: string,
  opts: ScanOptions = {},
): TripwireMatch[] {
  const patterns = opts.patterns ?? DEFAULT_PATTERNS;
  const source = opts.source ?? 'unknown';
  const ts = isoFromOpts(opts.now);

  const matches: TripwireMatch[] = [];

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      const idx = findKeywordIndex(content, keyword);
      if (idx < 0) continue;

      matches.push({
        ts,
        target_type: pattern.target_type,
        matched_keyword: keyword,
        source,
        excerpt: makeExcerpt(content, idx, keyword),
        gate_category: pattern.gate_category,
      });
    }
  }

  return matches;
}

// ============================================================
// Export 2: categorizeWithGate
// ============================================================

/**
 * 4-gate-types label 付与の helper aggregation。
 * label only (enforcement は blocking + escalating のみ)、 pure function、 副作用なし。
 */
export function categorizeWithGate(matches: TripwireMatch[]): GateCategorization {
  const by_category: Record<GateCategory, TripwireMatch[]> = {
    advisory: [],
    validating: [],
    blocking: [],
    escalating: [],
  };

  for (const m of matches) {
    by_category[m.gate_category].push(m);
  }

  return {
    by_category,
    blocking_count: by_category.blocking.length,
    escalating_count: by_category.escalating.length,
    total_count: matches.length,
  };
}

// ============================================================
// Export 3: enforceTripwire
// ============================================================

/**
 * matches に blocking / escalating gate がある場合 enforcement 発火。
 *
 * - audit log: ~/.shared-ops/_daemon/aira_tripwire.log に JSONL append
 * - jun approval inbox: blocking / escalating 発火時のみ起票
 * - advisory / validating のみ → log のみ (blocked=false、 inbox 起票なし)
 * - 空 matches → no-op (file 未生成)
 */
export async function enforceTripwire(
  matches: TripwireMatch[],
  opts: EnforceOptions = {},
): Promise<EnforceResult> {
  const notes: string[] = [];

  if (matches.length === 0) {
    return {
      blocked: false,
      approval_inbox_path: null,
      audit_log_appended: false,
      notes: ['no matches, no-op'],
    };
  }

  const now = opts.now ?? new Date();
  const logPath = opts.logPath ? expandHome(opts.logPath) : defaultLogPath();
  const inboxDir = opts.inboxPath ? expandHome(opts.inboxPath) : defaultInboxDir();

  const cat = categorizeWithGate(matches);
  const shouldBlock = cat.blocking_count > 0 || cat.escalating_count > 0;

  notes.push(
    `${cat.total_count} match${cat.total_count === 1 ? '' : 'es'} detected ` +
      `(${cat.blocking_count} blocking, ${cat.escalating_count} escalating, ` +
      `${cat.by_category.advisory.length} advisory, ${cat.by_category.validating.length} validating)`,
  );

  let auditLogAppended = false;
  try {
    await mkdir(dirname(logPath), { recursive: true });
    const lines = matches.map((m) =>
      JSON.stringify({
        ts: m.ts,
        target_type: m.target_type,
        gate_category: m.gate_category,
        matched_keyword: m.matched_keyword,
        source: m.source,
        excerpt: m.excerpt,
        enforced: shouldBlock,
        recorded_at: now.toISOString(),
      }),
    );

    let existing = '';
    try {
      existing = await readFile(logPath, 'utf-8');
    } catch {
      existing = '';
    }
    const appendBlock = lines.join('\n') + '\n';
    const newContent =
      existing.length > 0
        ? `${existing.endsWith('\n') ? existing : existing + '\n'}${appendBlock}`
        : appendBlock;
    await writeFile(logPath, newContent, 'utf-8');
    auditLogAppended = true;
    notes.push('audit log appended');
  } catch (err) {
    notes.push(`audit log write failure: ${(err as Error).message}`);
  }

  let approvalInboxPath: string | null = null;
  if (shouldBlock) {
    const dateStr = now.toISOString().slice(0, 10);
    const topic =
      opts.approvalTopic ??
      (cat.escalating_count > 0
        ? cat.by_category.escalating[0].target_type
        : cat.by_category.blocking[0].target_type);

    const fileName = `${dateStr}_aira_tripwire_jun_approval_${topic}.md`;
    const fullPath = join(inboxDir, fileName);

    try {
      await mkdir(inboxDir, { recursive: true });
      const body = renderApprovalInbox(matches, cat, now);
      await writeFile(fullPath, body, 'utf-8');
      approvalInboxPath = fullPath;
      notes.push(`jun approval inbox written: ${fileName}`);
    } catch (err) {
      notes.push(`approval inbox write failure: ${(err as Error).message}`);
    }
  }

  return {
    blocked: shouldBlock,
    approval_inbox_path: approvalInboxPath,
    audit_log_appended: auditLogAppended,
    notes,
  };
}

function renderApprovalInbox(
  matches: TripwireMatch[],
  cat: GateCategorization,
  now: Date,
): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`generated: ${now.toISOString()}`);
  lines.push('generated_by: aira-tripwire.ts');
  lines.push('phase: 0 (minimum viable)');
  lines.push(`blocking_count: ${cat.blocking_count}`);
  lines.push(`escalating_count: ${cat.escalating_count}`);
  lines.push('---');
  lines.push('');
  lines.push(`# Aira Tripwire — jun approval 待ち`);
  lines.push('');
  lines.push(
    'Tripwire (Red gate 検出) が発火しました。 jun の判断が確定するまで該当 action は停止しています。',
  );
  lines.push('');

  lines.push('## 検出 matches');
  lines.push('');
  for (const m of matches) {
    lines.push(`### ${m.target_type} (${m.gate_category})`);
    lines.push('');
    lines.push(`- matched_keyword: \`${m.matched_keyword}\``);
    lines.push(`- source: ${m.source}`);
    lines.push(`- ts: ${m.ts}`);
    lines.push(`- excerpt: "${m.excerpt}"`);
    lines.push('');
  }

  lines.push('## jun decision');
  lines.push('');
  lines.push('- [ ] approve (該当 action を resume)');
  lines.push('- [ ] reject (該当 action を中止)');
  lines.push('- [ ] modify (条件付き approve、 下記 note 参照)');
  lines.push('');
  lines.push('### note');
  lines.push('');
  lines.push('(jun 記入欄)');
  lines.push('');

  lines.push('## next step');
  lines.push('');
  lines.push('- approve → Zen / Kai 側で resume + status 更新');
  lines.push('- reject → action 撤回 + diary に記録');
  lines.push('- modify → 条件反映 reform 後 resume');
  lines.push('');

  return lines.join('\n');
}

// ============================================================
// Export 4: scanJudgmentsForTripwire
// ============================================================

/**
 * Evaluator → Tripwire chain 連動 (I/O contract、 Kai 10 軸 9 番反映)。
 *
 * Evaluator の `FailureJudgment` を入力に、 description / evidence_pointer.extract
 * から keyword scan。 内部で `scanForTripwireTargets` を call。
 */
export function scanJudgmentsForTripwire(
  judgments: FailureJudgment[],
  opts: ScanOptions = {},
): TripwireMatch[] {
  const matches: TripwireMatch[] = [];
  for (const j of judgments) {
    const content = `${j.description}\n${j.evidence_pointer.extract}`;
    const found = scanForTripwireTargets(content, {
      ...opts,
      source: opts.source ?? j.evidence_pointer.source_file,
    });
    matches.push(...found);
  }
  return matches;
}
