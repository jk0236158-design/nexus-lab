/**
 * Chat 関連ロジックのユニットテスト
 * - getChatMessages() の board ファイルパース
 * - checkOwnerHaltFlag() のフラグ検出
 * board への書き込みは Oto (API route) 側の責務のため、ここでは mock で読み取りを確認する
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// fs モジュールをモック
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
import { getChatMessages, checkOwnerHaltFlag } from '../shared-ops';

// モックヘルパー
function mockExists(paths: string[]) {
  vi.mocked(fs.existsSync).mockImplementation((p) =>
    paths.some((allowed) => String(p).includes(allowed)),
  );
}

function mockReaddir(files: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(fs.readdirSync).mockReturnValue(files as any);
}

function mockReadFile(contentMap: Record<string, string>) {
  vi.mocked(fs.readFileSync).mockImplementation((p) => {
    const key = Object.keys(contentMap).find((k) => String(p).includes(k));
    return key ? contentMap[key] : '';
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---- getChatMessages ----

describe('getChatMessages', () => {
  it('board ディレクトリが存在しない場合は空配列を返す', () => {
    mockExists([]);
    expect(getChatMessages()).toEqual([]);
  });

  it('owner_kai_* ファイルを fromOwner=true として返す', () => {
    mockExists(['board']);
    mockReaddir(['2026-04-19_owner_kai_hello-test.md']);
    mockReadFile({
      '2026-04-19_owner_kai_hello-test.md': [
        '---',
        'from: owner',
        'to: kai',
        'kind: consultation',
        'date: 2026-04-19',
        'topic: hello test',
        'source: ops-console-chat',
        '---',
        '',
        'Hello Kai!',
      ].join('\n'),
    });

    const messages = getChatMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].fromOwner).toBe(true);
    expect(messages[0].to).toBe('kai');
    expect(messages[0].date).toBe('2026-04-19');
    expect(messages[0].subject).toBe('hello test');
    expect(messages[0].isReply).toBe(false);
    expect(messages[0].requestedAgent).toBeNull();
  });

  it('owner_zen_request_to_iwa_* を requestedAgent=iwa として返す', () => {
    mockExists(['board']);
    mockReaddir(['2026-04-19_owner_zen_request_to_iwa_fix-bug.md']);
    mockReadFile({
      '2026-04-19_owner_zen_request_to_iwa_fix-bug.md': [
        '---',
        'from: owner',
        'to: zen',
        'requested_agent: iwa',
        'kind: instruction',
        'date: 2026-04-19',
        'topic: fix bug',
        'source: ops-console-chat',
        '---',
        '',
        'Please fix the bug.',
      ].join('\n'),
    });

    const messages = getChatMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].to).toBe('zen');
    expect(messages[0].requestedAgent).toBe('iwa');
    expect(messages[0].fromOwner).toBe(true);
  });

  it('_response_ を含むファイルを isReply=true として返す', () => {
    mockExists(['board']);
    mockReaddir(['2026-04-19_zen_owner_response_hello-test.md']);
    mockReadFile({
      '2026-04-19_zen_owner_response_hello-test.md': [
        '---',
        'from: zen',
        'to: owner',
        'kind: reply',
        'date: 2026-04-19',
        'topic: hello test reply',
        '---',
        '',
        'Got it!',
      ].join('\n'),
    });

    const messages = getChatMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].isReply).toBe(true);
  });

  it('owner / reply に関係ないファイルはスキップする', () => {
    mockExists(['board']);
    mockReaddir([
      'zen_kai_design_meeting.md',
      'iwa_zen_progress_report.md',
    ]);
    mockReadFile({});

    const messages = getChatMessages();
    expect(messages).toHaveLength(0);
  });

  it('複数ファイルが日付降順で返される', () => {
    mockExists(['board']);
    mockReaddir([
      '2026-04-17_owner_zen_old-message.md',
      '2026-04-19_owner_kai_new-message.md',
    ]);
    mockReadFile({
      '2026-04-17_owner_zen_old-message.md': '---\nfrom: owner\nto: zen\ntopic: old\n---\n',
      '2026-04-19_owner_kai_new-message.md': '---\nfrom: owner\nto: kai\ntopic: new\n---\n',
    });

    const messages = getChatMessages();
    expect(messages[0].date).toBe('2026-04-19');
    expect(messages[1].date).toBe('2026-04-17');
  });

  it('fs エラー時は空配列を返す（安全性確認）', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    expect(getChatMessages()).toEqual([]);
  });
});

// ---- checkOwnerHaltFlag ----

describe('checkOwnerHaltFlag', () => {
  it('owner_halt.flag が存在する場合は true を返す', () => {
    vi.mocked(fs.existsSync).mockImplementation((p) =>
      String(p).includes('owner_halt.flag'),
    );
    expect(checkOwnerHaltFlag()).toBe(true);
  });

  it('owner_halt.flag が存在しない場合は false を返す', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    expect(checkOwnerHaltFlag()).toBe(false);
  });
});
