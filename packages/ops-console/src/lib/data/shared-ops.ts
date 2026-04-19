import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import type { BoardMessage, OwnerDecision, AgentStatus, ChatSentMessage } from '../types';

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || 'C:\\Users\\jk023\\.shared-ops';

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
  const statusDir = join(SHARED_OPS_PATH, 'status');
  const agents: Array<{ file: string; agent: 'zen' | 'kai' }> = [
    { file: 'zen_status.md', agent: 'zen' },
    { file: 'kai_status.md', agent: 'kai' },
  ];

  const results: AgentStatus[] = [];

  for (const { file, agent } of agents) {
    const filePath = join(statusDir, file);
    if (!existsSync(filePath)) continue;

    try {
      const content = readFileSync(filePath, 'utf-8');
      results.push(parseAgentStatus(content, agent));
    } catch {
      // スキップ
    }
  }

  return results;
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
