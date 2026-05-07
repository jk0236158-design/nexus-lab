import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const AIRA_DATA_PATH =
  process.env.AIRA_DATA_PATH ||
  'C:\\Users\\jk023\\nexus-lab\\aira\\data';

const DIGESTS_DIR = join(AIRA_DATA_PATH, 'digests');

export interface YuinoDigestEntry {
  filename: string;
  date: string;
  mtime: number;
}

export interface YuinoDigest {
  filename: string;
  date: string;
  content: string;
  contradictionNotes: string[];
  waitObservations: string[];
  sourcePath: string;
}

export function getYuinoDigestList(): YuinoDigestEntry[] {
  if (!existsSync(DIGESTS_DIR)) return [];
  try {
    const files = readdirSync(DIGESTS_DIR).filter(
      (f) => f.endsWith('.md') && f.includes('digest'),
    );
    const entries: YuinoDigestEntry[] = files.map((filename) => {
      const filePath = join(DIGESTS_DIR, filename);
      let mtime = 0;
      try {
        mtime = statSync(filePath).mtimeMs;
      } catch {
        mtime = 0;
      }
      const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : '';
      return { filename, date, mtime };
    });
    return entries.sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
}

export function getLatestYuinoDigest(): YuinoDigest | null {
  const list = getYuinoDigestList();
  if (list.length === 0) return null;
  return getYuinoDigestByFilename(list[0].filename);
}

export function getYuinoDigestByFilename(
  filename: string,
): YuinoDigest | null {
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null;
  }
  const filePath = join(DIGESTS_DIR, filename);
  if (!existsSync(filePath)) return null;
  let content = '';
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
  const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? dateMatch[1] : '';
  return {
    filename,
    date,
    content,
    contradictionNotes: parseContradictionNotes(content),
    waitObservations: parseWaitObservations(content),
    sourcePath: filePath,
  };
}

export function getYuinoDigestByDate(date: string): YuinoDigest | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const list = getYuinoDigestList();
  const match = list.find((e) => e.date === date);
  if (!match) return null;
  return getYuinoDigestByFilename(match.filename);
}

function parseSection(content: string, header: string): string {
  const re = new RegExp(
    `##\\s+${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i',
  );
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

function parseContradictionNotes(content: string): string[] {
  const sec = parseSection(content, 'Contradiction Notes');
  if (!sec) return [];
  return sec
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && (l.startsWith('-') || /^[🔴🟡🟢]/.test(l) || /^\*\*/.test(l)));
}

function parseWaitObservations(content: string): string[] {
  const sec = parseSection(content, 'WAIT Observations');
  if (!sec) return [];
  return sec
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.startsWith('-'));
}

export const __internal = {
  parseSection,
  parseContradictionNotes,
  parseWaitObservations,
  AIRA_DATA_PATH,
  DIGESTS_DIR,
};
