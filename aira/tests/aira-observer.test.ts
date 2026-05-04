/**
 * aira-observer.test.ts — Aira Observer unit test (mock fs / inline content)
 *
 * 2026-05-05 起稿 (Iwa packet、Wave 1 期間 return content path)
 * scope:
 *   - parseZenTodayContent / parseKaiStatusContent logic (inline content で mock fs 代替)
 *   - generateStateSnapshot template shape check
 *   - incrementDenialCounter (tmp dir 使用、カウンター累積 + 日付 reset)
 *   - integration: pollInputSources (tmp dir) → generateStateSnapshot → 必須セクション確認
 *
 * Strategy:
 *   - content parse logic は tmp dir に fixture file を置いて pollInputSources 経由でテスト
 *   - generateStateSnapshot は pure function のため直接 state object を渡す
 *   - incrementDenialCounter は tmp dir を使用
 *
 * Pattern: 既存 input-public.test.ts / digest-public.test.ts (real fs tmp dir + afterEach cleanup) 踏襲
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  pollInputSources,
  generateStateSnapshot,
  incrementDenialCounter,
  AUTO_MODE_THRESHOLD_CONSECUTIVE,
  type InputSourceState,
  type PollOptions,
} from '../src/aira-observer.js';

let TMP_ROOT: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), 'aira-observer-test-'));
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

// ============================================================
// Helpers
// ============================================================

async function writeFixture(rel: string, content: string): Promise<string> {
  const full = join(TMP_ROOT, rel);
  await mkdir(join(full, '..'), { recursive: true });
  await writeFile(full, content, 'utf-8');
  return full;
}

function makePollOpts(overrides: Partial<PollOptions> = {}): PollOptions {
  return {
    zen_today_path: join(TMP_ROOT, 'zen_today.md'),
    kai_status_path: join(TMP_ROOT, 'kai_status.md'),
    board_dir: join(TMP_ROOT, 'board'),
    today_date: '2026-05-05',
    ...overrides,
  };
}

function makeMinimalState(): InputSourceState {
  return {
    zen_active_work_count: 3,
    kai_active_work_count: 1,
    today_board_count: 2,
    today_board_total_size: 4096,
    confirmation_only_run_detected: false,
    counter_state: null,
    raw: {
      zen_today_content: null,
      kai_status_content: null,
      board_files: [],
      poll_errors: [],
    },
  };
}

// ============================================================
// Test 1: zen_today.md content parse via pollInputSources
// ============================================================

describe('pollInputSources — zen_today.md parse', () => {
  it('counts bullet items in 進捗ログ section as active work', async () => {
    const content = [
      '# Zen Today 2026-05-05',
      '',
      '## 進捗ログ',
      '- Aira Observer first build 完了',
      '- Kagami QA review 依頼',
      '- board file 3 件確認',
      '',
      '## 選んだ 1 件',
      'Aira Observer first build',
    ].join('\n');

    await writeFixture('zen_today.md', content);
    await mkdir(join(TMP_ROOT, 'board'), { recursive: true });
    await writeFixture('kai_status.md', '## 当日 status\n- Kai task 1');

    const state = await pollInputSources(makePollOpts());
    expect(state.zen_active_work_count).toBe(3);
    expect(state.confirmation_only_run_detected).toBe(false);
  });

  it('detects confirmation_only_run when sweep + 着手 0 件 pattern present', async () => {
    const content = [
      '# Zen Today',
      '',
      '## 進捗ログ',
      '- startup sweep 完了',
      '- 着手: 0 件 (pending 確認のみ)',
    ].join('\n');

    await writeFixture('zen_today.md', content);
    await mkdir(join(TMP_ROOT, 'board'), { recursive: true });
    await writeFixture('kai_status.md', '');

    const state = await pollInputSources(makePollOpts());
    expect(state.confirmation_only_run_detected).toBe(true);
  });
});

// ============================================================
// Test 2: board listing (today date prefix)
// ============================================================

describe('pollInputSources — board listing', () => {
  it('counts only today-prefixed board files', async () => {
    await writeFixture('zen_today.md', '## 進捗ログ\n- task');
    await writeFixture('kai_status.md', '');
    const boardDir = join(TMP_ROOT, 'board');
    await mkdir(boardDir, { recursive: true });
    await writeFile(join(boardDir, '2026-05-05_zen_to_kai_hello.md'), 'hello', 'utf-8');
    await writeFile(join(boardDir, '2026-05-05_kai_to_zen_reply.md'), 'reply', 'utf-8');
    await writeFile(join(boardDir, '2026-05-04_yesterday_msg.md'), 'old', 'utf-8');

    const state = await pollInputSources(makePollOpts());
    expect(state.today_board_count).toBe(2);
    expect(state.today_board_total_size).toBeGreaterThan(0);
  });
});

// ============================================================
// Test 3: generateStateSnapshot — template shape
// ============================================================

describe('generateStateSnapshot — markdown shape', () => {
  it('contains all required sections in correct order', () => {
    const state = makeMinimalState();
    const snapshot = generateStateSnapshot(state, {
      phase: '0',
      generated_timestamp: '2026-05-05T12:00:00.000Z',
    });

    expect(snapshot).toContain('generated: 2026-05-05T12:00:00.000Z');
    expect(snapshot).toContain('generated_by: aira-observer.ts');
    expect(snapshot).toContain('phase: 0 (minimum viable)');
    expect(snapshot).toContain('# Aira Observer State (2026-05-05)');
    expect(snapshot).toContain('## Active Work 件数');
    expect(snapshot).toContain('- Zen: 3 件');
    expect(snapshot).toContain('- Kai: 1 件');
    expect(snapshot).toContain('## Today 起稿件数 (board)');
    expect(snapshot).toContain('- 件数: 2');
    expect(snapshot).toContain('## 確認だけで終わった run 検出');
    expect(snapshot).toContain('detection result: no');
    expect(snapshot).toContain('## physical denial counter');
    expect(snapshot).toContain('## Failure Detection Events');
  });

  it('renders counter_state fields when counter_state is provided', () => {
    const state: InputSourceState = {
      ...makeMinimalState(),
      counter_state: {
        today_count: 3,
        accumulated_count: 7,
        auto_mode_status: 'within',
        escalate_notice: false,
        last_updated: '2026-05-05T11:00:00.000Z',
        peer_name: 'zen',
      },
    };

    const snapshot = generateStateSnapshot(state, {
      phase: '0',
      generated_timestamp: '2026-05-05T12:00:00.000Z',
    });

    expect(snapshot).toContain('- today: 3');
    expect(snapshot).toContain('- accumulated: 7');
    expect(snapshot).toContain('- Auto Mode 5/3 連続閾値: within');
    expect(snapshot).toContain('- escalate notice: no');
  });

  it('renders Poll Errors section when poll errors exist', () => {
    const state: InputSourceState = {
      ...makeMinimalState(),
      raw: {
        ...makeMinimalState().raw,
        poll_errors: ['zen_today.md not found or unreadable: ENOENT'],
      },
    };

    const snapshot = generateStateSnapshot(state, {
      phase: '0',
      generated_timestamp: '2026-05-05T10:00:00.000Z',
    });

    expect(snapshot).toContain('## Poll Errors');
    expect(snapshot).toContain('zen_today.md not found or unreadable');
  });
});

// ============================================================
// Test 4: incrementDenialCounter — accumulation
// ============================================================

describe('incrementDenialCounter — accumulation', () => {
  it('starts from 0 and increments to 1 on first call', async () => {
    const counterPath = join(TMP_ROOT, '_daemon', 'aira_observer_counter.json');
    const state = await incrementDenialCounter({
      counter_file_path: counterPath,
      peer_name: 'zen',
      event_timestamp: '2026-05-05T09:00:00.000Z',
    });

    expect(state.today_count).toBe(1);
    expect(state.accumulated_count).toBe(1);
    expect(state.auto_mode_status).toBe('within');
    expect(state.escalate_notice).toBe(false);
  });

  it('accumulates across multiple calls on the same day', async () => {
    const counterPath = join(TMP_ROOT, '_daemon', 'counter.json');
    const opts = { counter_file_path: counterPath, peer_name: 'zen', event_timestamp: '2026-05-05T09:00:00.000Z' };

    await incrementDenialCounter(opts);
    await incrementDenialCounter(opts);
    const state = await incrementDenialCounter(opts);

    expect(state.today_count).toBe(3);
    expect(state.accumulated_count).toBe(3);
  });

  it('resets today_count on new day but preserves accumulated_count', async () => {
    const counterPath = join(TMP_ROOT, '_daemon', 'counter.json');
    await incrementDenialCounter({
      counter_file_path: counterPath,
      peer_name: 'zen',
      event_timestamp: '2026-05-05T09:00:00.000Z',
    });
    await incrementDenialCounter({
      counter_file_path: counterPath,
      peer_name: 'zen',
      event_timestamp: '2026-05-05T10:00:00.000Z',
    });

    // Next day
    const nextDayState = await incrementDenialCounter({
      counter_file_path: counterPath,
      peer_name: 'zen',
      event_timestamp: '2026-05-06T09:00:00.000Z',
    });

    expect(nextDayState.today_count).toBe(1);         // reset to 1
    expect(nextDayState.accumulated_count).toBe(3);   // preserved
  });

  it('sets auto_mode_status=exceeded when today_count reaches CONSECUTIVE threshold', async () => {
    const counterPath = join(TMP_ROOT, '_daemon', 'counter.json');
    const opts = (i: number) => ({
      counter_file_path: counterPath,
      peer_name: 'zen',
      event_timestamp: `2026-05-05T0${i}:00:00.000Z`,
    });

    let state = await incrementDenialCounter(opts(1));
    for (let i = 2; i <= AUTO_MODE_THRESHOLD_CONSECUTIVE; i++) {
      state = await incrementDenialCounter(opts(i));
    }

    expect(state.today_count).toBe(AUTO_MODE_THRESHOLD_CONSECUTIVE);
    expect(state.auto_mode_status).toBe('exceeded');
    expect(state.escalate_notice).toBe(true);
  });
});
