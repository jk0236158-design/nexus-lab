import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';
import type { BoardMessage, OwnerDecision, AgentStatus, ChatSentMessage } from '../types';

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || 'C:\\Users\\jk023\\.shared-ops';

const AIRA_CLOSED_LOOP_STATUS_PATH =
  process.env.AIRA_CLOSED_LOOP_STATUS_PATH ||
  'C:\\Users\\jk023\\.shared-ops\\status\\aira_closed_loop_status.md';

const YUINO_DIGEST_DIR =
  process.env.YUINO_DIGEST_DIR ||
  'C:\\Users\\jk023\\nexus-lab\\aira\\data\\digests';

export function getBoardMessages(): BoardMessage[] {
  const boardDir = join(SHARED_OPS_PATH, 'board');
  if (!existsSync(boardDir)) return [];

  try {
    const files = readdirSync(boardDir).filter((f) => f.endsWith('.md'));
    return files
      .map((filename) => parseBoardFilename(filename, boardDir))
      .filter((msg): msg is BoardMessage => msg !== null);
  } catch {
    return [];
  }
}

export function getOwnerDecisions(): OwnerDecision[] {
  const decisionsDir = join(SHARED_OPS_PATH, 'owner-decisions');
  if (!existsSync(decisionsDir)) return [];

  try {
    const files = readdirSync(decisionsDir).filter((f) => f.endsWith('.md'));
    return files.map((filename) => {
      const filePath = join(decisionsDir, filename);
      const content = safeReadFile(filePath);
      const name = basename(filename, '.md');

      // ファイル名から日付を抽出（先頭のYYYY-MM-DD部分）
      const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : '';

      // タイトルはファイル名の日付以降の部分（アンダースコアをスペースに）
      const titlePart = name.replace(/^\d{4}-\d{2}-\d{2}_?/, '');
      const title = titlePart.replace(/_/g, ' ') || name;

      return { filename, date, title, content };
    });
  } catch {
    return [];
  }
}

export function getAgentStatuses(): AgentStatus[] {
  const results: AgentStatus[] = [];

  // ── zen / kai (既存 path 維持) ──
  const statusDir = join(SHARED_OPS_PATH, 'status');
  const aiAgents: Array<{ file: string; agent: 'zen' | 'kai' }> = [
    { file: 'zen_status.md', agent: 'zen' },
    { file: 'kai_status.md', agent: 'kai' },
  ];

  for (const { file, agent } of aiAgents) {
    const filePath = join(statusDir, file);
    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, 'utf-8');
      results.push(parseAgentStatus(content, agent));
    } catch {
      // スキップ
    }
  }

  // ── aira (内部実装、 Kai-side daemon が生成する state file を readonly read) ──
  results.push(readAiraStatus());

  // ── yuino (公開商品、 最新 digest を mtime で選択) ──
  results.push(readYuinoStatus());

  return results;
}

function readAiraStatus(): AgentStatus {
  const placeholder: AgentStatus = {
    agent: 'aira',
    lastSession: '未取得',
    summary: '内部実装 (Kai owned)、 closed_loop_status.md 不在のため待機中',
    isOnline: false,
  };

  if (!existsSync(AIRA_CLOSED_LOOP_STATUS_PATH)) return placeholder;

  try {
    const content = readFileSync(AIRA_CLOSED_LOOP_STATUS_PATH, 'utf-8');
    // markdown form を簡易 parse (zen/kai parser 流用)
    const parsed = parseAgentStatus(content, 'zen');
    return {
      agent: 'aira',
      lastSession: parsed.lastSession || '不明',
      summary: parsed.summary || '内部実装 supervisor (Kai 主導)',
      isOnline: false,
    };
  } catch {
    return placeholder;
  }
}

function readYuinoStatus(): AgentStatus {
  const placeholder: AgentStatus = {
    agent: 'yuino',
    lastSession: '未取得',
    summary: '公開商品 surface (Zen + Kai 共同)、 digest 未生成',
    isOnline: false,
  };

  if (!existsSync(YUINO_DIGEST_DIR)) return placeholder;

  try {
    const files = readdirSync(YUINO_DIGEST_DIR)
      .filter((f) => f.endsWith('_yuino_digest.md'))
      .map((f) => ({
        file: f,
        path: join(YUINO_DIGEST_DIR, f),
      }));

    if (files.length === 0) return placeholder;

    // mtime 最新を選択
    let latest: { file: string; path: string; mtime: number } | null = null;
    for (const f of files) {
      try {
        const stat = statSync(f.path);
        const mtime = stat.mtimeMs as number;
        if (!latest || mtime > latest.mtime) {
          latest = { ...f, mtime };
        }
      } catch {
        // skip
      }
    }
    if (!latest) return placeholder;

    const content = readFileSync(latest.path, 'utf-8');
    const parsed = parseAgentStatus(content, 'zen');
    const dateMatch = latest.file.match(/^(\d{4}-\d{2}-\d{2})/);
    const lastSession = parsed.lastSession || (dateMatch ? dateMatch[1] : '不明');
    return {
      agent: 'yuino',
      lastSession,
      summary: parsed.summary || '公開商品 digest (Zen + Kai 共同)',
      isOnline: false,
    };
  } catch {
    return placeholder;
  }
}

export function getChatMessages(): ChatSentMessage[] {
  const boardDir = join(SHARED_OPS_PATH, 'board');
  if (!existsSync(boardDir)) return [];

  try {
    const files = readdirSync(boardDir).filter((f) => f.endsWith('.md'));
    const results: ChatSentMessage[] = [];

    for (const filename of files) {
      const name = basename(filename, '.md');
      const parts = name.split('_');

      // owner_* または *_owner_ を含むファイルを対象とする
      const isOwnerSent = parts[1] === 'owner'; // owner が from
      const isReply =
        filename.includes('_response_') ||
        (parts.length >= 3 && parts[2] === 'owner'); // owner が to

      if (!isOwnerSent && !isReply) continue;

      const filePath = join(boardDir, filename);
      const content = safeReadFile(filePath);
      const frontmatter = parseFrontmatter(content);

      const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : '';

      // source が ops-console-chat のものだけ Chat 画面に表示
      // ただし v0 は全 owner_* を表示（reply 含む）
      results.push({
        filename,
        date,
        to: frontmatter.to ?? parts[2] ?? '',
        requestedAgent: frontmatter.requested_agent ?? null,
        kind: frontmatter.kind ?? '',
        subject: frontmatter.topic ?? parts.slice(3).join(' '),
        isReply,
        fromOwner: isOwnerSent,
      });
    }

    // 日付降順
    return results.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

export function checkOwnerHaltFlag(): boolean {
  const flagPath = join(SHARED_OPS_PATH, 'owner_halt.flag');
  return existsSync(flagPath);
}

// --- ヘルパー ---

function parseBoardFilename(
  filename: string,
  dir: string,
): BoardMessage | null {
  // 形式: {日付}_{from}_{to}_{件名}.md
  const name = basename(filename, '.md');
  const parts = name.split('_');

  if (parts.length < 4) return null;

  const date = parts[0];
  const from = parts[1];
  const to = parts[2];
  const subject = parts.slice(3).join(' ');
  const content = safeReadFile(join(dir, filename));

  return { filename, date, from, to, subject, content };
}

function parseAgentStatus(content: string, agent: 'zen' | 'kai'): AgentStatus {
  const lines = content.split('\n');

  // 「最終更新:」行からlastSessionを取得
  let lastSession = '';
  for (const line of lines) {
    const match = line.match(/最終更新[:：]\s*(.+)/);
    if (match) {
      lastSession = match[1].trim();
      break;
    }
  }

  // 最初の## セクションの内容をsummaryとする
  let summary = '';
  let inFirstSection = false;
  for (const line of lines) {
    if (line.startsWith('## ') && !inFirstSection) {
      inFirstSection = true;
      continue;
    }
    if (line.startsWith('## ') && inFirstSection) {
      break;
    }
    if (inFirstSection) {
      summary += line + '\n';
    }
  }
  summary = summary.trim();

  return {
    agent,
    lastSession,
    summary,
    isOnline: false, // 静的読み取りではオフライン扱い
  };
}

function safeReadFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function parseFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return result;

  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}
