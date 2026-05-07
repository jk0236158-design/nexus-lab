import { describe, it, expect } from 'vitest';
import { AiraStatusCard } from '../aira-status-card';

describe('AiraStatusCard', () => {
  it('React component として export されている', () => {
    expect(typeof AiraStatusCard).toBe('function');
    expect(AiraStatusCard.name).toBe('AiraStatusCard');
  });

  it('status undefined を受け取っても throw しない (placeholder)', () => {
    expect(() => AiraStatusCard({ status: undefined })).not.toThrow();
  });

  it('status を渡しても throw しない', () => {
    expect(() =>
      AiraStatusCard({
        status: {
          agent: 'aira',
          lastSession: '2026-05-07',
          summary: 'closed loop step 1: observe\nstep 2: decide',
          isOnline: false,
        },
      }),
    ).not.toThrow();
  });
});
