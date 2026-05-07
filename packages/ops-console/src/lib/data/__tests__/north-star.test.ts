import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    readdirSync: vi.fn(),
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import * as fs from 'fs';
import { getNorthStarProgress } from '../north-star';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getNorthStarProgress', () => {
  it('shared-ops directory が空でも throw せず default 返却', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const progress = getNorthStarProgress();

    expect(progress.junInterventionFrequencyWeekly).toBe(0);
    expect(progress.revenueCoverageRatio).toBe(0);
    expect(progress.aiBudgetMonthlyConsumption).toBe(0);
    expect(progress.fiveStepChecklist).toHaveLength(5);
    expect(progress.distanceScore).toBe(50);
  });

  it('5 step checklist が 5 件で step name を含む', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const progress = getNorthStarProgress();

    const stepNames = progress.fiveStepChecklist.map((c) => c.step);
    expect(stepNames[0]).toContain('Yuino dogfood');
    expect(stepNames[1]).toContain('Polar.sh');
    expect(stepNames[2]).toContain('Setup Memo');
    expect(stepNames[3]).toContain('weekly workflow');
    expect(stepNames[4]).toContain('5/31 measure');
  });
});
