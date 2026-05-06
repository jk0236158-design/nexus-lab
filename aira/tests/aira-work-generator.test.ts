/**
 * aira-work-generator.test.ts — Aira Work Generator unit + integration test
 *
 * 2026-05-06 起稿 (Iwa packet、Wave 1 期間 return content path)
 * scope:
 *   - parseFailureEvents: JSONL parse + malformed skip + since filter
 *   - generateNextGreenWork: failure type 別 routing + maxProposals=3 圧縮 + needs_kai_gate field
 *   - appendProposals: real fs で markdown section append (read back verify)
 *
 * Pattern: 既存 aira-observer.test.ts / aira-observer-fs.test.ts (mkdtemp + afterEach rm -rf) 踏襲。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseFailureEvents,
  generateNextGreenWork,
  appendProposals,
  DEFAULT_MAX_PROPOSALS,
  type FailureEvent,
  type FailureType,
} from '../src/aira-work-generator.js';

let TMP_ROOT: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), 'aira-work-generator-test-'));
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

// ============================================================
// Helpers
// ============================================================

function makeEvent(overrides: Partial<FailureEvent> = {}): FailureEvent {
  return {
    ts: '2026-05-06T10:00:00.000Z',
    type: 'idle',
    source: 'zen_today',
    evidence: 'Active Work 0 件、30 min 以上経過 detect',
    ...overrides,
  };
}

// ============================================================
// Test 1: parseFailureEvents — valid JSONL parse
// ============================================================

describe('parseFailureEvents — JSONL parse', () => {
  it('parses valid JSONL log with one event of each type', async () => {
    const types: FailureType[] = ['idle', 'self_drive', 'trigger', 'recovery', 'escalate', 'reliability'];
    const lines = types.map((t, i) =>
      JSON.stringify({
        ts: `2026-05-06T1${i}:00:00.000Z`,
        type: t,
        source: `source_${t}`,
        evidence: `evidence for ${t}`,
      }),
    );
    const logPath = join(TMP_ROOT, 'observer.log');
    await writeFile(logPath, lines.join('\n'), 'utf-8');

    const events = await parseFailureEvents({ logPath });
    expect(events).toHaveLength(types.length);
    const parsedTypes = events.map((e) => e.type).sort();
    expect(parsedTypes).toEqual([...types].sort());
  });

  it('skips malformed lines (graceful degradation) and parses valid ones', async () => {
    const goodLine = JSON.stringify({
      ts: '2026-05-06T10:00:00.000Z',
      type: 'idle',
      source: 'zen_today',
      evidence: 'good event',
    });
    const malformed = [
      'not json at all',
      '{ "ts": "2026-05-06T10:00:00.000Z", "type": "unknown_type", "source": "x", "evidence": "y" }',
      '{ "ts": 12345, "type": "idle", "source": "x", "evidence": "y" }',
      '{ "type": "idle", "source": "x", "evidence": "y" }',
      '',
      '   ',
    ];
    const logPath = join(TMP_ROOT, 'observer.log');
    await writeFile(logPath, [goodLine, ...malformed, goodLine].join('\n'), 'utf-8');

    const events = await parseFailureEvents({ logPath });
    expect(events).toHaveLength(2);
    expect(events[0].evidence).toBe('good event');
  });

  it('applies since filter to drop earlier events', async () => {
    const lines = [
      JSON.stringify({
        ts: '2026-05-06T08:00:00.000Z',
        type: 'idle',
        source: 'old',
        evidence: 'old event',
      }),
      JSON.stringify({
        ts: '2026-05-06T11:00:00.000Z',
        type: 'self_drive',
        source: 'new',
        evidence: 'new event',
      }),
    ];
    const logPath = join(TMP_ROOT, 'observer.log');
    await writeFile(logPath, lines.join('\n'), 'utf-8');

    const events = await parseFailureEvents({
      logPath,
      since: new Date('2026-05-06T10:00:00.000Z'),
    });
    expect(events).toHaveLength(1);
    expect(events[0].source).toBe('new');
  });

  it('returns empty array gracefully when log file does not exist', async () => {
    const events = await parseFailureEvents({
      logPath: join(TMP_ROOT, 'nonexistent.log'),
    });
    expect(events).toEqual([]);
  });
});

// ============================================================
// Test 2: generateNextGreenWork — routing + 圧縮 + needs_kai_gate
// ============================================================

describe('generateNextGreenWork — routing + 圧縮', () => {
  it('routes each failure type to the correct action_type', () => {
    const cases: Array<{ type: FailureType; expectedAction: string; expectedNeedsGate: boolean }> = [
      { type: 'idle', expectedAction: 'wide_scope_pool_pick', expectedNeedsGate: false },
      { type: 'self_drive', expectedAction: 'board_inbox_draft', expectedNeedsGate: false },
      { type: 'trigger', expectedAction: 'observer_repoll', expectedNeedsGate: false },
      { type: 'recovery', expectedAction: 'tripwire_unblock_propose', expectedNeedsGate: false },
      { type: 'escalate', expectedAction: 'cross_check_ritual', expectedNeedsGate: true },
      { type: 'reliability', expectedAction: 'per_step_required_downgrade', expectedNeedsGate: true },
    ];

    for (const c of cases) {
      const event = makeEvent({ type: c.type, ts: '2026-05-06T10:00:00.000Z' });
      const proposals = generateNextGreenWork([event], { maxProposals: 1 });
      expect(proposals).toHaveLength(1);
      expect(proposals[0].action_type).toBe(c.expectedAction);
      expect(proposals[0].needs_kai_gate).toBe(c.expectedNeedsGate);
      expect(proposals[0].source_event).toEqual(event);
      expect(proposals[0].rationale.length).toBeGreaterThan(0);
    }
  });

  it('compresses 5 input events to 3 proposals by default (Aira role: 圧縮 engine)', () => {
    expect(DEFAULT_MAX_PROPOSALS).toBe(3);

    const events: FailureEvent[] = [
      makeEvent({ type: 'idle', ts: '2026-05-06T10:00:00.000Z' }),
      makeEvent({ type: 'self_drive', ts: '2026-05-06T10:05:00.000Z' }),
      makeEvent({ type: 'trigger', ts: '2026-05-06T10:10:00.000Z' }),
      makeEvent({ type: 'recovery', ts: '2026-05-06T10:15:00.000Z' }),
      makeEvent({ type: 'escalate', ts: '2026-05-06T10:20:00.000Z' }),
    ];

    const proposals = generateNextGreenWork(events);
    expect(proposals).toHaveLength(3);

    expect(proposals[0].source_event.type).toBe('escalate');
    expect(proposals[1].source_event.type).toBe('recovery');
    expect(proposals[2].source_event.type).toBe('trigger');
  });

  it('sets needs_kai_gate=true only for escalate / reliability (Kai 10 軸 7 番反映)', () => {
    const events: FailureEvent[] = [
      makeEvent({ type: 'idle', ts: '2026-05-06T10:00:00.000Z' }),
      makeEvent({ type: 'self_drive', ts: '2026-05-06T10:01:00.000Z' }),
      makeEvent({ type: 'trigger', ts: '2026-05-06T10:02:00.000Z' }),
      makeEvent({ type: 'recovery', ts: '2026-05-06T10:03:00.000Z' }),
      makeEvent({ type: 'escalate', ts: '2026-05-06T10:04:00.000Z' }),
      makeEvent({ type: 'reliability', ts: '2026-05-06T10:05:00.000Z' }),
    ];

    const proposals = generateNextGreenWork(events, { maxProposals: 6 });
    expect(proposals).toHaveLength(6);

    const gateMap = new Map(proposals.map((p) => [p.source_event.type, p.needs_kai_gate]));
    expect(gateMap.get('idle')).toBe(false);
    expect(gateMap.get('self_drive')).toBe(false);
    expect(gateMap.get('trigger')).toBe(false);
    expect(gateMap.get('recovery')).toBe(false);
    expect(gateMap.get('escalate')).toBe(true);
    expect(gateMap.get('reliability')).toBe(true);
  });

  it('returns empty array when input events is empty', () => {
    const proposals = generateNextGreenWork([]);
    expect(proposals).toEqual([]);
  });
});

// ============================================================
// Test 3: appendProposals — real fs markdown append
// ============================================================

describe('appendProposals — real fs markdown append', () => {
  it('writes proposals as markdown sections and appends on subsequent calls', async () => {
    const outputPath = join(TMP_ROOT, 'state', 'aira_work_generator_proposals.md');

    const event: FailureEvent = {
      ts: '2026-05-06T10:30:00+09:00',
      type: 'self_drive',
      source: 'zen_today',
      evidence: '進捗ログ 30 min 更新なし、file write 0 件 detect',
    };
    const firstBatch = generateNextGreenWork([event], {
      maxProposals: 1,
      generated_timestamp: '2026-05-06T10:35:00+09:00',
    });
    await appendProposals(firstBatch, { outputPath });

    let content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('## 2026-05-06T10:35:00+09:00 — board_inbox_draft (needs_kai_gate=false)');
    expect(content).toContain('- source_event: self_drive @ zen_today (2026-05-06T10:30:00+09:00)');
    expect(content).toContain('- evidence: "進捗ログ 30 min 更新なし、file write 0 件 detect"');
    expect(content).toContain('- rationale: 自走失敗連続');

    const secondEvent: FailureEvent = {
      ts: '2026-05-06T11:00:00+09:00',
      type: 'escalate',
      source: 'board_listing',
      evidence: 'cross-check 候補 detect',
    };
    const secondBatch = generateNextGreenWork([secondEvent], {
      maxProposals: 1,
      generated_timestamp: '2026-05-06T11:05:00+09:00',
    });
    await appendProposals(secondBatch, { outputPath });

    content = await readFile(outputPath, 'utf-8');
    expect(content).toContain('board_inbox_draft (needs_kai_gate=false)');
    expect(content).toContain('cross_check_ritual (needs_kai_gate=true)');
    const sectionCount = (content.match(/^## 2026/gm) || []).length;
    expect(sectionCount).toBe(2);
  });

  it('is a no-op when proposals array is empty', async () => {
    const outputPath = join(TMP_ROOT, 'state', 'aira_work_generator_proposals.md');
    await appendProposals([], { outputPath });

    await expect(readFile(outputPath, 'utf-8')).rejects.toThrow();
  });
});
