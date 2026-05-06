/**
 * aira-evaluator.test.ts — Aira Evaluator unit + integration test
 *
 * 2026-05-06 起稿 (Iwa packet、 Wave 1 期間 return content path)
 * scope:
 *   - evaluateFailures: idle / self_drive / escalate (consecutive + accumulated) 判定 + 全 source 不在 graceful
 *   - formatJudgments: markdown form + evidence_pointer + review_tag 含む
 *   - appendFailureEventsLog: JSONL form append + Work Generator parseFailureEvents 互換性 cross-check
 *   - appendJudgments: markdown form append + read back verify
 *
 * Pattern: 既存 aira-work-generator.test.ts (mkdtemp + afterEach rm -rf) 踏襲。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  evaluateFailures,
  formatJudgments,
  appendFailureEventsLog,
  appendJudgments,
  DEFAULT_THRESHOLDS,
  type FailureJudgment,
} from '../src/aira-evaluator.js';
import { parseFailureEvents } from '../src/aira-work-generator.js';

let TMP_ROOT: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), 'aira-evaluator-test-'));
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

async function writeStateFile(path: string, generated: string, zenCount: number): Promise<void> {
  const md = [
    '---',
    `generated: ${generated}`,
    'generated_by: aira-observer.ts',
    'phase: 0 (minimum viable)',
    '---',
    '',
    '# Aira Observer State',
    '',
    '## Active Work 件数',
    `- Zen: ${zenCount} 件 (zen_today.md の進捗ログから抽出)`,
    '- Kai: 0 件',
    '',
  ].join('\n');
  await writeFile(path, md, 'utf-8');
}

async function writeCounterFile(
  path: string,
  data: Record<string, unknown>,
): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

describe('evaluateFailures — idle 判定', () => {
  it('emits idle judgment when Active Work=0 and state is older than threshold', async () => {
    const statePath = join(TMP_ROOT, 'aira_observer_state.md');
    const oldGenerated = '2026-05-06T09:00:00.000Z';
    await writeStateFile(statePath, oldGenerated, 0);

    const now = new Date('2026-05-06T10:00:00.000Z');
    const judgments = await evaluateFailures({
      state_path: statePath,
      counter_path: join(TMP_ROOT, 'no_counter.json'),
      zen_today_path: join(TMP_ROOT, 'no_zen_today.md'),
      now,
    });

    const idle = judgments.find((j) => j.type === 'idle');
    expect(idle).toBeDefined();
    expect(idle!.confidence).toBe('medium');
    expect(idle!.review_tag).toBe('human_review_recommended');
    expect(idle!.evidence_pointer.source_file).toBe(statePath);
    expect(idle!.evidence_pointer.extract).toContain('0 件');
    expect(idle!.description).toContain('idle threshold 超過');
  });

  it('does not emit idle judgment when Active Work > 0', async () => {
    const statePath = join(TMP_ROOT, 'aira_observer_state.md');
    await writeStateFile(statePath, '2026-05-06T09:00:00.000Z', 3);

    const now = new Date('2026-05-06T10:00:00.000Z');
    const judgments = await evaluateFailures({
      state_path: statePath,
      counter_path: join(TMP_ROOT, 'no_counter.json'),
      zen_today_path: join(TMP_ROOT, 'no_zen_today.md'),
      now,
    });

    expect(judgments.find((j) => j.type === 'idle')).toBeUndefined();
  });
});

describe('evaluateFailures — self_drive 判定', () => {
  it('emits self_drive judgment when zen_today progress log is stale and write events=0', async () => {
    const zenTodayPath = join(TMP_ROOT, 'zen_today.md');
    const md = [
      '# zen_today',
      '',
      '## 進捗ログ',
      '',
      '(no entries yet)',
      '',
    ].join('\n');
    await writeFile(zenTodayPath, md, 'utf-8');

    const oldTime = new Date('2026-05-06T08:00:00.000Z');
    await utimes(zenTodayPath, oldTime, oldTime);

    const now = new Date('2026-05-06T10:00:00.000Z');
    const judgments = await evaluateFailures({
      state_path: join(TMP_ROOT, 'no_state.md'),
      counter_path: join(TMP_ROOT, 'no_counter.json'),
      zen_today_path: zenTodayPath,
      now,
    });

    const sd = judgments.find((j) => j.type === 'self_drive');
    expect(sd).toBeDefined();
    expect(sd!.review_tag).toBe('human_review_recommended');
    expect(sd!.confidence).toBe('medium');
    expect(sd!.evidence_pointer.source_file).toBe(zenTodayPath);
  });
});

describe('evaluateFailures — escalate 判定 (consecutive denial)', () => {
  it('emits escalate when consecutive_denials >= threshold', async () => {
    const counterPath = join(TMP_ROOT, 'aira_observer_counter.json');
    await writeCounterFile(counterPath, {
      today_date: '2026-05-06',
      today_count: 7,
      accumulated_count: 12,
      last_updated: '2026-05-06T10:55:00+09:00',
      peer_name: 'zen',
    });

    const now = new Date('2026-05-06T11:00:00+09:00');
    const judgments = await evaluateFailures({
      state_path: join(TMP_ROOT, 'no_state.md'),
      counter_path: counterPath,
      zen_today_path: join(TMP_ROOT, 'no_zen_today.md'),
      now,
    });

    const esc = judgments.find((j) => j.type === 'escalate');
    expect(esc).toBeDefined();
    expect(esc!.confidence).toBe('high');
    expect(esc!.review_tag).toBe('human_review_required');
    expect(esc!.description).toContain('consecutive 7');
    expect(esc!.evidence_pointer.source_file).toBe(counterPath);
  });
});

describe('evaluateFailures — escalate 判定 (accumulated denial)', () => {
  it('emits escalate when accumulated_denials >= threshold', async () => {
    const counterPath = join(TMP_ROOT, 'aira_observer_counter.json');
    await writeCounterFile(counterPath, {
      today_date: '2026-05-06',
      today_count: 2,
      accumulated_count: 25,
      last_updated: '2026-05-06T10:55:00+09:00',
      peer_name: 'zen',
    });

    const now = new Date('2026-05-06T11:00:00+09:00');
    const judgments = await evaluateFailures({
      state_path: join(TMP_ROOT, 'no_state.md'),
      counter_path: counterPath,
      zen_today_path: join(TMP_ROOT, 'no_zen_today.md'),
      now,
    });

    const esc = judgments.find((j) => j.type === 'escalate');
    expect(esc).toBeDefined();
    expect(esc!.confidence).toBe('high');
    expect(esc!.description).toContain('accumulated 25');
  });
});

describe('evaluateFailures — graceful when all sources missing', () => {
  it('returns empty array (no throw) when all source files do not exist', async () => {
    const judgments = await evaluateFailures({
      state_path: join(TMP_ROOT, 'no_state.md'),
      counter_path: join(TMP_ROOT, 'no_counter.json'),
      zen_today_path: join(TMP_ROOT, 'no_zen_today.md'),
      now: new Date('2026-05-06T10:00:00.000Z'),
    });

    expect(judgments).toEqual([]);
    expect(DEFAULT_THRESHOLDS.idle_min_minutes).toBe(30);
  });
});

describe('formatJudgments — markdown form', () => {
  it('renders judgment with header, description, evidence_pointer, review_tag', () => {
    const judgment: FailureJudgment = {
      ts: '2026-05-06T11:00:00+09:00',
      type: 'escalate',
      confidence: 'high',
      evidence_pointer: {
        source_file: '~/.shared-ops/_daemon/aira_observer_counter.json',
        timestamp: '2026-05-06T10:55:00+09:00',
        extract: 'consecutive_denials: 7, accumulated_denials: 22',
      },
      review_tag: 'human_review_required',
      description: '連続 denial 7 件 detect、 escalate threshold 超過',
    };

    const md = formatJudgments([judgment]);
    expect(md).toContain(
      '## 2026-05-06T11:00:00+09:00 — escalate (confidence=high, review_tag=human_review_required)',
    );
    expect(md).toContain('- description: 連続 denial 7 件 detect、 escalate threshold 超過');
    expect(md).toContain('- evidence_pointer:');
    expect(md).toContain('  - source_file: ~/.shared-ops/_daemon/aira_observer_counter.json');
    expect(md).toContain('  - timestamp: 2026-05-06T10:55:00+09:00');
    expect(md).toContain('  - extract: "consecutive_denials: 7, accumulated_denials: 22"');
  });

  it('returns empty string when judgments array is empty', () => {
    expect(formatJudgments([])).toBe('');
  });
});

describe('appendFailureEventsLog — JSONL append + Work Generator 互換', () => {
  it('writes JSONL events that Work Generator parseFailureEvents can read back', async () => {
    const logPath = join(TMP_ROOT, '_daemon', 'aira_failure_events.log');

    const judgment: FailureJudgment = {
      ts: '2026-05-06T11:00:00+09:00',
      type: 'escalate',
      confidence: 'high',
      evidence_pointer: {
        source_file: '/abs/path/aira_observer_counter.json',
        timestamp: '2026-05-06T10:55:00+09:00',
        extract: 'consecutive_denials: 7, accumulated_denials: 22',
      },
      review_tag: 'human_review_required',
      description: 'denial threshold 超過',
    };

    await appendFailureEventsLog([judgment], { logPath });

    const raw = await readFile(logPath, 'utf-8');
    expect(raw.trim().split('\n')).toHaveLength(1);
    const obj = JSON.parse(raw.trim());
    expect(obj.ts).toBe('2026-05-06T11:00:00+09:00');
    expect(obj.type).toBe('escalate');
    expect(obj.source).toBe('/abs/path/aira_observer_counter.json');
    expect(obj.evidence).toBe('consecutive_denials: 7, accumulated_denials: 22');
    expect(obj.meta?.confidence).toBe('high');
    expect(obj.meta?.review_tag).toBe('human_review_required');

    const events = await parseFailureEvents({ logPath });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('escalate');
    expect(events[0].source).toBe('/abs/path/aira_observer_counter.json');
    expect(events[0].evidence).toBe('consecutive_denials: 7, accumulated_denials: 22');

    const second: FailureJudgment = {
      ...judgment,
      ts: '2026-05-06T12:00:00+09:00',
      type: 'idle',
      review_tag: 'human_review_recommended',
      confidence: 'medium',
    };
    await appendFailureEventsLog([second], { logPath });

    const events2 = await parseFailureEvents({ logPath });
    expect(events2).toHaveLength(2);
    expect(events2.map((e) => e.type).sort()).toEqual(['escalate', 'idle']);
  });

  it('is a no-op when judgments array is empty', async () => {
    const logPath = join(TMP_ROOT, '_daemon', 'aira_failure_events.log');
    await appendFailureEventsLog([], { logPath });
    await expect(readFile(logPath, 'utf-8')).rejects.toThrow();
  });
});

describe('appendJudgments — markdown form append', () => {
  it('writes markdown sections and appends on subsequent calls', async () => {
    const judgmentsPath = join(TMP_ROOT, 'state', 'aira_failure_judgments.md');

    const first: FailureJudgment = {
      ts: '2026-05-06T11:00:00+09:00',
      type: 'idle',
      confidence: 'medium',
      evidence_pointer: {
        source_file: '/abs/aira_observer_state.md',
        timestamp: '2026-05-06T10:00:00+09:00',
        extract: 'Active Work Zen: 0 件、 60 min 経過',
      },
      review_tag: 'human_review_recommended',
      description: 'Active Work 0 件で 60 min 経過、 idle threshold 超過',
    };

    await appendJudgments([first], { judgmentsPath });

    let content = await readFile(judgmentsPath, 'utf-8');
    expect(content).toContain(
      '## 2026-05-06T11:00:00+09:00 — idle (confidence=medium, review_tag=human_review_recommended)',
    );
    expect(content).toContain('- description: Active Work 0 件で 60 min 経過');

    const second: FailureJudgment = {
      ts: '2026-05-06T12:00:00+09:00',
      type: 'escalate',
      confidence: 'high',
      evidence_pointer: {
        source_file: '/abs/aira_observer_counter.json',
        timestamp: '2026-05-06T11:55:00+09:00',
        extract: 'consecutive_denials: 6',
      },
      review_tag: 'human_review_required',
      description: 'denial threshold 超過',
    };
    await appendJudgments([second], { judgmentsPath });

    content = await readFile(judgmentsPath, 'utf-8');
    expect(content).toContain('idle (confidence=medium');
    expect(content).toContain('escalate (confidence=high');
    const sectionCount = (content.match(/^## 2026/gm) || []).length;
    expect(sectionCount).toBe(2);
  });
});
