import { describe, it, expect } from 'vitest';
import { YuinoStatusCard } from '../yuino-status-card';

describe('YuinoStatusCard', () => {
  it('React component として export されている', () => {
    expect(typeof YuinoStatusCard).toBe('function');
    expect(YuinoStatusCard.name).toBe('YuinoStatusCard');
  });

  it('status undefined を受け取っても throw しない', () => {
    expect(() => YuinoStatusCard({ status: undefined })).not.toThrow();
  });

  it('status を渡しても throw しない', () => {
    expect(() =>
      YuinoStatusCard({
        status: {
          agent: 'yuino',
          lastSession: '2026-05-07',
          summary: 'public surface digest',
          isOnline: false,
        },
      }),
    ).not.toThrow();
  });
});
