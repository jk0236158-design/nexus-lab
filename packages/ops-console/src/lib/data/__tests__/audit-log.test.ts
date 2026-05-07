import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    appendFileSync: vi.fn(),
  };
});

import * as fs from 'fs';
import { appendAuditLog, readAuditLog, readRecentAuditLog } from '../audit-log';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('appendAuditLog (Yuino セキュリティ v0 axis 13a)', () => {
  it('append-only で JSONL 1 行 write', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.appendFileSync).mockReturnValue(undefined);

    appendAuditLog({
      action: 'inbox.decide',
      endpoint: '/api/v1/inbox/test.md/decide',
      method: 'POST',
      affected_files: ['/test/inbox/test.md'],
      user_identity: 'jun',
      request_summary: 'decision=approve',
      response_status: 200,
      permission_level: 'internal-execute',
    });

    expect(fs.appendFileSync).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(fs.appendFileSync).mock.calls[0];
    const line = String(callArgs[1]);
    expect(line).toContain('inbox.decide');
    expect(line).toContain('jun');
    expect(line).toContain('"timestamp"');
    expect(line.endsWith('\n')).toBe(true);
  });

  it('audit dir 不在で mkdirSync trigger', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.appendFileSync).mockReturnValue(undefined);

    appendAuditLog({
      action: 'inbox.decide',
      endpoint: '/api/v1/inbox/test.md/decide',
      method: 'POST',
      affected_files: [],
      user_identity: 'jun',
      request_summary: 'test',
      response_status: 200,
      permission_level: 'internal-execute',
    });

    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  it('graceful degradation: append failure で throw しない', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.appendFileSync).mockImplementation(() => {
      throw new Error('disk full');
    });

    expect(() =>
      appendAuditLog({
        action: 'inbox.decide',
        endpoint: '/test',
        method: 'POST',
        affected_files: [],
        user_identity: 'jun',
        request_summary: 'test',
        response_status: 200,
        permission_level: 'internal-execute',
      }),
    ).not.toThrow();
  });
});

describe('readAuditLog', () => {
  it('file 不在で []', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(readAuditLog(2026, 5)).toEqual([]);
  });

  it('JSONL を parse して entries return', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const lines = [
      JSON.stringify({
        timestamp: '2026-05-07T10:00:00Z',
        action: 'inbox.decide',
        endpoint: '/test',
        method: 'POST',
        affected_files: [],
        user_identity: 'jun',
        request_summary: 'test',
        response_status: 200,
        permission_level: 'internal-execute',
      }),
      'malformed-json-skipped',
      JSON.stringify({
        timestamp: '2026-05-07T11:00:00Z',
        action: 'board.write',
        endpoint: '/test',
        method: 'POST',
        affected_files: [],
        user_identity: 'zen',
        request_summary: 'test',
        response_status: 200,
        permission_level: 'internal-execute',
      }),
    ].join('\n');
    vi.mocked(fs.readFileSync).mockReturnValue(lines);

    const entries = readAuditLog(2026, 5);
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('inbox.decide');
    expect(entries[1].action).toBe('board.write');
  });
});
