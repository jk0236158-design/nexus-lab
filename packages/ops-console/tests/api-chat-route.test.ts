/**
 * POST /api/chat route — unit tests
 *
 * 戦略:
 * - fs.promises をモックして実ファイルシステムに書かない
 * - NextRequest / NextResponse の依存は最小シム
 * - routing logic と markdown 生成を中心に検証
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';

// ─── fs.promises のモック ─────────────────────────────────────────────────────

const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockRename = vi.fn().mockResolvedValue(undefined);
const mockUnlink = vi.fn().mockResolvedValue(undefined);
const mockMkdir = vi.fn().mockResolvedValue(undefined);

vi.mock('fs', () => ({
  promises: {
    writeFile: mockWriteFile,
    rename: mockRename,
    unlink: mockUnlink,
    mkdir: mockMkdir,
  },
}));

// ─── Next.js Request/Response シム ───────────────────────────────────────────

class MockRequest {
  private _body: string;
  constructor(body: unknown) {
    this._body = JSON.stringify(body);
  }
  async json() {
    return JSON.parse(this._body);
  }
}

// モック後に route をインポート (dynamic import でモックが先に適用されるようにする)
const { POST } = await import('../src/app/api/chat/route.js');

// ─── ヘルパー ────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new MockRequest(body) as unknown as import('next/server').NextRequest;
}

function getCapturedMarkdown(): string {
  // writeFile の第2引数が Markdown 本文
  const call = mockWriteFile.mock.calls[0];
  return call ? (call[1] as string) : '';
}

function getCapturedTmpPath(): string {
  const call = mockWriteFile.mock.calls[0];
  return call ? (call[0] as string) : '';
}

function getCapturedFinalPath(): string {
  const call = mockRename.mock.calls[0];
  return call ? (call[1] as string) : '';
}

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── バリデーション ──────────────────────────────────────────────────────────

  describe('validation', () => {
    it('不正 JSON は 400 を返す', async () => {
      const req = {
        json: async () => { throw new SyntaxError('bad json'); },
      } as unknown as import('next/server').NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });

    it('必須フィールド欠如は 422 を返す', async () => {
      const res = await POST(makeRequest({ to: 'Zen', kind: '指示' })); // subject/body なし
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.details).toBeDefined();
    });

    it('無効な宛先は 422 を返す', async () => {
      const res = await POST(makeRequest({
        to: 'InvalidAgent',
        kind: '指示',
        subject: 'test',
        body: 'test body',
      }));
      expect(res.status).toBe(422);
    });

    it('無効な kind は 422 を返す', async () => {
      const res = await POST(makeRequest({
        to: 'Zen',
        kind: 'unknown',
        subject: 'test',
        body: 'test body',
      }));
      expect(res.status).toBe(422);
    });

    it('subject が空文字列は 422 を返す', async () => {
      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '相談',
        subject: '',
        body: 'body',
      }));
      expect(res.status).toBe(422);
    });

    it('subject が 101 文字は 422 を返す', async () => {
      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '相談',
        subject: 'a'.repeat(101),
        body: 'body',
      }));
      expect(res.status).toBe(422);
    });

    it('body が 2001 文字は 422 を返す', async () => {
      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '相談',
        subject: 'test',
        body: 'a'.repeat(2001),
      }));
      expect(res.status).toBe(422);
    });
  });

  // ── routing: 直接宛先 ────────────────────────────────────────────────────────

  describe('routing: direct targets (Kai / Zen)', () => {
    it('Zen 宛は owner_zen_*.md を生成する', async () => {
      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'テストの件',
        body: '確認してください',
      }));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.filename).toMatch(/^\d{4}-\d{2}-\d{2}_owner_zen_/);
      expect(body.filename).not.toContain('request_to');
    });

    it('Kai 宛は owner_kai_*.md を生成する', async () => {
      const res = await POST(makeRequest({
        to: 'Kai',
        kind: '相談',
        subject: '市場調査の件',
        body: '最新データを教えて',
      }));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.filename).toMatch(/^\d{4}-\d{2}-\d{2}_owner_kai_/);
    });

    it('Zen 宛 frontmatter に requested_agent が含まれない', async () => {
      await POST(makeRequest({
        to: 'Zen',
        kind: '報告',
        subject: 'daily report',
        body: 'body',
      }));

      const md = getCapturedMarkdown();
      expect(md).not.toContain('requested_agent');
    });
  });

  // ── routing: チームメンバー宛 ────────────────────────────────────────────────

  describe('routing: team members (Iwa / Oto / Akari / Kagami / Hoshi / Kura)', () => {
    const members = ['Iwa', 'Oto', 'Akari', 'Kagami', 'Hoshi', 'Kura'] as const;

    for (const member of members) {
      it(`${member} 宛は owner_zen_request_to_${member.toLowerCase()}_*.md を生成する`, async () => {
        const res = await POST(makeRequest({
          to: member,
          kind: '指示',
          subject: `${member}への依頼`,
          body: '作業内容',
        }));

        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.filename).toContain('owner_zen_request_to_' + member.toLowerCase() + '_');
      });
    }

    it('Iwa 宛 frontmatter に to:zen + requested_agent:iwa が含まれる', async () => {
      await POST(makeRequest({
        to: 'Iwa',
        kind: '指示',
        subject: 'architecture review',
        body: 'お願いします',
      }));

      const md = getCapturedMarkdown();
      expect(md).toContain('to: zen');
      expect(md).toContain('requested_agent: iwa');
    });
  });

  // ── Markdown 生成 ────────────────────────────────────────────────────────────

  describe('markdown content', () => {
    it('frontmatter に source:ops-console-chat が含まれる', async () => {
      await POST(makeRequest({
        to: 'Zen',
        kind: '雑談',
        subject: 'hello',
        body: 'hi there',
      }));

      const md = getCapturedMarkdown();
      expect(md).toContain('source: ops-console-chat');
    });

    it('kind 英語変換が正しい (相談→consultation, 指示→instruction)', async () => {
      await POST(makeRequest({ to: 'Zen', kind: '相談', subject: 'q', body: 'b' }));
      expect(getCapturedMarkdown()).toContain('kind: consultation');

      vi.clearAllMocks();
      await POST(makeRequest({ to: 'Zen', kind: '指示', subject: 'q', body: 'b' }));
      expect(getCapturedMarkdown()).toContain('kind: instruction');

      vi.clearAllMocks();
      await POST(makeRequest({ to: 'Zen', kind: '雑談', subject: 'q', body: 'b' }));
      expect(getCapturedMarkdown()).toContain('kind: casual');

      vi.clearAllMocks();
      await POST(makeRequest({ to: 'Zen', kind: '報告', subject: 'q', body: 'b' }));
      expect(getCapturedMarkdown()).toContain('kind: report');
    });

    it('本文が Markdown に含まれる', async () => {
      const bodyText = 'これはテスト本文です。重要な情報を含む。';
      await POST(makeRequest({
        to: 'Kai',
        kind: '報告',
        subject: 'test',
        body: bodyText,
      }));

      const md = getCapturedMarkdown();
      expect(md).toContain(bodyText);
    });

    it('from:owner が frontmatter に含まれる', async () => {
      await POST(makeRequest({ to: 'Zen', kind: '指示', subject: 's', body: 'b' }));
      expect(getCapturedMarkdown()).toContain('from: owner');
    });
  });

  // ── atomic write ─────────────────────────────────────────────────────────────

  describe('atomic write (tempfile + rename)', () => {
    it('writeFile と rename の両方が呼ばれる', async () => {
      await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'atomic test',
        body: 'body',
      }));

      expect(mockWriteFile).toHaveBeenCalledOnce();
      expect(mockRename).toHaveBeenCalledOnce();
    });

    it('writeFile は tempfile パスに書く (.tmp_ prefix)', async () => {
      await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'atomic test',
        body: 'body',
      }));

      const tmpPath = getCapturedTmpPath();
      expect(path.basename(tmpPath)).toMatch(/^\.tmp_/);
    });

    it('rename の最終パスは board ディレクトリ内', async () => {
      await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'atomic test',
        body: 'body',
      }));

      const finalPath = getCapturedFinalPath();
      expect(finalPath).toContain('.shared-ops');
      expect(finalPath).toContain('board');
    });

    it('writeFile 失敗時は 500 を返す', async () => {
      mockWriteFile.mockRejectedValueOnce(new Error('ENOSPC'));

      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'fail test',
        body: 'body',
      }));

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });

    it('rename 失敗時は 500 を返しかつ tempfile 削除を試みる', async () => {
      mockRename.mockRejectedValueOnce(new Error('EXDEV'));

      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'rename fail',
        body: 'body',
      }));

      expect(res.status).toBe(500);
      // unlink による cleanup が呼ばれること
      expect(mockUnlink).toHaveBeenCalled();
    });
  });

  // ── 機微情報（warn only） ────────────────────────────────────────────────────

  describe('sensitive pattern detection (warn only)', () => {
    it('API key 含む本文でも 201 を返す（reject しない）', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '相談',
        subject: 'key test',
        body: 'my key is sk-ant-abc123456789',
      }));

      expect(res.status).toBe(201);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive pattern'),
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });
  });

  // ── レスポンス形式 ────────────────────────────────────────────────────────────

  describe('response format', () => {
    it('201 レスポンスに filename と absolutePath が含まれる', async () => {
      const res = await POST(makeRequest({
        to: 'Zen',
        kind: '指示',
        subject: 'response format test',
        body: 'body',
      }));

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(typeof body.filename).toBe('string');
      expect(body.filename.endsWith('.md')).toBe(true);
      expect(typeof body.absolutePath).toBe('string');
    });
  });
});
