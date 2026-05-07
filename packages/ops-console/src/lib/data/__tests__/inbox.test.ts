import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn(),
  };
});

import * as fs from 'fs';
import { getInboxItems, getInboxItem, __internal } from '../inbox';

const SAMPLE_INBOX = `---
date: 2026-05-07
from: zen
to: jun
subject: sample approval request
priority: A
deadline: 2026-05-08
---

# 本文

これは sample body です。
`;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('inbox data layer', () => {
  it('getInboxItems: directory 不在で空配列', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(getInboxItems()).toEqual([]);
  });

  it('getInboxItem: path traversal ガード', () => {
    expect(getInboxItem('../etc/passwd')).toBeNull();
    expect(getInboxItem('foo/bar.md')).toBeNull();
    expect(getInboxItem('foo\\bar.md')).toBeNull();
    expect(getInboxItem('not-md.txt')).toBeNull();
    expect(getInboxItem('')).toBeNull();
  });

  it('parseFrontmatter: key: value 行を抽出', () => {
    const out = __internal.parseFrontmatter(
      'date: 2026-05-07\nfrom: zen\nsubject: hello: world\n',
    );
    expect(out.date).toBe('2026-05-07');
    expect(out.from).toBe('zen');
    expect(out.subject).toBe('hello: world');
  });

  it('splitFrontmatter: --- で囲まれた frontmatter を分離', () => {
    const { frontmatter, body } = __internal.splitFrontmatter(SAMPLE_INBOX);
    expect(frontmatter).toContain('date: 2026-05-07');
    expect(body).toContain('# 本文');
  });

  it('normalizeStatus: 不明値は pending', () => {
    expect(__internal.normalizeStatus(undefined)).toBe('pending');
    expect(__internal.normalizeStatus('weird')).toBe('pending');
    expect(__internal.normalizeStatus('approved')).toBe('approved');
    expect(__internal.normalizeStatus('REJECTED')).toBe('rejected');
    expect(__internal.normalizeStatus('modified')).toBe('modified');
  });
});
