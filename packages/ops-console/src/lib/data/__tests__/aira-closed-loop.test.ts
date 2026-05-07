import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn(),
  };
});

import * as fs from 'fs';
import {
  getAiraClosedLoopStatus,
  getAiraClosedLoopLogTail,
  summarizeStepStatuses,
  CLOSED_LOOP_STEPS,
} from '../aira-closed-loop';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('aira-closed-loop data layer', () => {
  it('getAiraClosedLoopStatus: file 全不在で defensive 値', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const status = getAiraClosedLoopStatus();
    expect(status.lastRunAt).toBeNull();
    expect(status.recentEvents).toEqual([]);
    expect(status.falsePositiveCount).toBe(0);
    expect(status.falseNegativeCount).toBe(0);
    expect(status.status).toContain('not present');
  });

  it('getAiraClosedLoopLogTail: 不在で []', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(getAiraClosedLoopLogTail(10)).toEqual([]);
  });

  it('getAiraClosedLoopLogTail: jsonl を parse して新しい順', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const lines = [
      JSON.stringify({ timestamp: 't1', step: 'observe', status: 'ok' }),
      JSON.stringify({ timestamp: 't2', step: 'decide', status: 'ok' }),
      'not-json-skipped',
      JSON.stringify({ timestamp: 't3', step: 'execute', status: 'fail', evidence: 'oops' }),
    ].join('\n');
    vi.mocked(fs.readFileSync).mockReturnValue(lines);

    const events = getAiraClosedLoopLogTail(10);
    expect(events).toHaveLength(3);
    expect(events[0].timestamp).toBe('t3');
    expect(events[0].evidence).toBe('oops');
    expect(events[2].step).toBe('observe');
  });

  it('summarizeStepStatuses: 各 step の最新 event を採用', () => {
    const events = [
      { timestamp: 't3', step: 'observe', status: 'ok' },
      { timestamp: 't2', step: 'observe', status: 'fail' },
      { timestamp: 't1', step: 'decide', status: 'ok' },
    ];
    const summary = summarizeStepStatuses(events);
    expect(summary.observe?.lastTimestamp).toBe('t3');
    expect(summary.observe?.lastStatus).toBe('ok');
    expect(summary.decide?.lastTimestamp).toBe('t1');
    expect(summary.dispatch).toBeNull();
  });

  it('CLOSED_LOOP_STEPS: 6 step 順序固定', () => {
    expect(CLOSED_LOOP_STEPS).toEqual([
      'observe',
      'decide',
      'dispatch',
      'verify',
      'recover',
      'execute',
    ]);
  });
});
