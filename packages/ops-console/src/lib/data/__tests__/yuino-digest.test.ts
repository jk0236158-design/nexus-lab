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
import {
  getLatestYuinoDigest,
  getYuinoDigestList,
  getYuinoDigestByDate,
  getYuinoDigestByFilename,
} from '../yuino-digest';

const SAMPLE_DIGEST = `# Yuino Digest

> Generated 2026-05-06T21:59:08.655Z

## Digest

something

## Contradiction Notes

🟡 first issue
- second issue

## WAIT Observations

- first wait
- second wait

## Boundary Audit

- result: PASS
`;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('yuino-digest data layer', () => {
  it('getYuinoDigestList: ディレクトリ不在で空配列', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(getYuinoDigestList()).toEqual([]);
  });

  it('getYuinoDigestByDate: 不正 format で null', () => {
    expect(getYuinoDigestByDate('not-a-date')).toBeNull();
  });

  it('getYuinoDigestByFilename: path traversal ガード', () => {
    expect(getYuinoDigestByFilename('../etc/passwd')).toBeNull();
    expect(getYuinoDigestByFilename('foo/bar.md')).toBeNull();
    expect(getYuinoDigestByFilename('foo\\bar.md')).toBeNull();
  });

  it('getLatestYuinoDigest: file 不在で null', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(getLatestYuinoDigest()).toBeNull();
  });

  it('parseContradictionNotes + parseWaitObservations: section 抽出が動く', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue([
      '2026-05-06_yuino_digest.md',
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    vi.mocked(fs.statSync).mockReturnValue({ mtimeMs: 100 } as unknown as ReturnType<typeof fs.statSync>);
    vi.mocked(fs.readFileSync).mockReturnValue(SAMPLE_DIGEST);

    const digest = getLatestYuinoDigest();
    expect(digest).not.toBeNull();
    expect(digest!.date).toBe('2026-05-06');
    expect(digest!.contradictionNotes.length).toBeGreaterThan(0);
    expect(digest!.waitObservations.length).toBeGreaterThan(0);
  });
});
