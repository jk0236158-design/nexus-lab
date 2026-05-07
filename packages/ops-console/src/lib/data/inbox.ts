import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import type { InboxItem, InboxStatus } from '@/lib/types';

// Yuino セキュリティ v0 axis 10 Approval Gate UI 用 data layer
// shared-ops/inbox/*.md を read、 frontmatter parse、 status field default = 'pending'

const SHARED_OPS_INBOX_PATH =
  process.env.SHARED_OPS_INBOX_PATH ||
  'C:\\Users\\jk023\\.shared-ops\\inbox';

interface ListOptions {
  status?: InboxStatus;
}

export function getInboxItems(options: ListOptions = {}): InboxItem[] {
  const filterStatus: InboxStatus = options.status ?? 'pending';

  if (!existsSync(SHARED_OPS_INBOX_PATH)) return [];

  let files: string[] = [];
  try {
    files = readdirSync(SHARED_OPS_INBOX_PATH).filter((f) =>
      f.endsWith('.md'),
    );
  } catch {
    return [];
  }

  const items: InboxItem[] = [];
  for (const filename of files) {
    const item = readInboxFile(filename);
    if (!item) continue;
    if (item.status === filterStatus) items.push(item);
  }

  items.sort((a, b) => {
    const ta = mtimeOf(a.filename);
    const tb = mtimeOf(b.filename);
    return tb - ta;
  });

  return items;
}

export function getInboxItem(filename: string): InboxItem | null {
  if (!isSafeFilename(filename)) return null;
  return readInboxFile(filename);
}

function isSafeFilename(filename: string): boolean {
  if (!filename) return false;
  if (filename.includes('..')) return false;
  if (filename.includes('/')) return false;
  if (filename.includes('\\')) return false;
  if (filename.includes('\0')) return false;
  if (!filename.endsWith('.md')) return false;
  return true;
}

function mtimeOf(filename: string): number {
  try {
    return statSync(join(SHARED_OPS_INBOX_PATH, filename)).mtimeMs;
  } catch {
    return 0;
  }
}

function readInboxFile(filename: string): InboxItem | null {
  if (!isSafeFilename(filename)) return null;
  const filePath = join(SHARED_OPS_INBOX_PATH, filename);
  if (!existsSync(filePath)) return null;

  let raw = '';
  try {
    raw = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  const { frontmatter, body } = splitFrontmatter(raw);
  const fm = parseFrontmatter(frontmatter);

  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  const fallbackDate = dateMatch ? dateMatch[1] : '';

  const status = normalizeStatus(fm.status);

  return {
    filename,
    date: fm.date || fallbackDate,
    from: fm.from || '',
    to: fm.to || '',
    subject: fm.subject || '',
    priority: fm.priority || '',
    deadline: fm.deadline || '',
    body: body.trim(),
    status,
  };
}

function splitFrontmatter(raw: string): {
  frontmatter: string;
  body: string;
} {
  if (!raw.startsWith('---')) {
    return { frontmatter: '', body: raw };
  }
  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    return { frontmatter: '', body: raw };
  }
  const frontmatter = raw.slice(3, end).replace(/^\r?\n/, '');
  const afterClose = raw.indexOf('\n', end + 4);
  const body = afterClose === -1 ? '' : raw.slice(afterClose + 1);
  return { frontmatter, body };
}

function parseFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith('  ') || line.startsWith('-')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = value;
  }
  return out;
}

function normalizeStatus(raw: string | undefined): InboxStatus {
  const v = (raw || '').toLowerCase();
  if (v === 'approved') return 'approved';
  if (v === 'rejected') return 'rejected';
  if (v === 'modified') return 'modified';
  return 'pending';
}

export const __internal = {
  SHARED_OPS_INBOX_PATH,
  isSafeFilename,
  splitFrontmatter,
  parseFrontmatter,
  normalizeStatus,
};
