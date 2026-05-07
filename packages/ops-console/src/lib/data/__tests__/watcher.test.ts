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
import { getWatcherStatus } from '../watcher';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('watcher data layer', () => {
  it('getWatcherStatus: file 全不在で down 判定', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const s = getWatcherStatus();
    expect(s.state).toBe('down');
    expect(s.pid).toBeNull();
    expect(s.suppressedCountToday).toBe(0);
    expect(s.suppressedCountTotal).toBe(0);
    expect(s.recentLogLines).toEqual([]);
  });

  it('getWatcherStatus: ZEN_DISPATCH_SUPPRESSED を count', () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const log = [
      `${todayStr}T10:00:00 ZEN_DISPATCH_SUPPRESSED reason=cap`,
      `${todayStr}T11:00:00 ZEN_DISPATCH_SUPPRESSED reason=cap`,
      `2026-01-01T00:00:00 ZEN_DISPATCH_SUPPRESSED reason=old`,
      `${todayStr}T12:00:00 normal log line`,
    ].join('\n');

    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
      const path = String(p);
      return path.endsWith('watcher.log') || path.endsWith('watcher.pid');
    });
    vi.mocked(fs.readFileSync).mockImplementation((p: unknown) => {
      const path = String(p);
      if (path.endsWith('watcher.pid')) return '42160';
      return log;
    });
    vi.mocked(fs.statSync).mockReturnValue({
      mtimeMs: Date.now(),
    } as unknown as ReturnType<typeof fs.statSync>);

    const s = getWatcherStatus();
    expect(s.suppressedCountTotal).toBe(3);
    expect(s.suppressedCountToday).toBe(2);
    expect(s.state).toBe('running');
    expect(s.pid).toBe(42160);
    expect(s.lastSuppressedAt).toBeTruthy();
  });

  it('getWatcherStatus: recentLogLines は最大 30 行', () => {
    vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) =>
      String(p).endsWith('watcher.log'),
    );
    const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n');
    vi.mocked(fs.readFileSync).mockReturnValue(lines);
    vi.mocked(fs.statSync).mockReturnValue({
      mtimeMs: Date.now(),
    } as unknown as ReturnType<typeof fs.statSync>);

    const s = getWatcherStatus();
    expect(s.recentLogLines).toHaveLength(30);
    expect(s.recentLogLines[0]).toBe('line 70');
    expect(s.recentLogLines[29]).toBe('line 99');
  });
});
