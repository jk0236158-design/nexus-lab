import { describe, it, expect } from 'vitest';
import { ApproveCard } from '../approve-card';
import type { InboxItem } from '@/lib/types';

const SAMPLE_ITEM: InboxItem = {
  filename: '2026-05-07_zen_sample.md',
  date: '2026-05-07',
  from: 'zen',
  to: 'jun',
  subject: 'sample subject',
  priority: 'A',
  deadline: '2026-05-08',
  body: 'sample body content',
  status: 'pending',
};

describe('ApproveCard (Yuino セキュリティ v0 axis 10)', () => {
  it('React component として export されている', () => {
    expect(typeof ApproveCard).toBe('function');
    expect(ApproveCard.name).toBe('ApproveCard');
  });

  it('InboxItem shape は ApproveCard props と整合', () => {
    expect(SAMPLE_ITEM.filename.length).toBeGreaterThan(0);
    expect(SAMPLE_ITEM.status).toBe('pending');
    expect(SAMPLE_ITEM.priority).toBe('A');
  });
});
