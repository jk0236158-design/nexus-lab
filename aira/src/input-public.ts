/**
 * input-public.ts — 商品化版 observer scopes ingestion (yuino)
 *
 * 5/03 evening 起稿 (Iwa packet 7、Zen 直筆 implement)
 *
 * 既存 input.ts は nokaze internal Phase 0 mini 用 (~/.shared-ops/ paths hard-coded)。
 * 本 file は商品化版、user の `yuino.config.yml` で declare された observer_scopes 配列を generic に ingest。
 *
 * Supported scope type (β scope):
 *   - file_directory: glob pattern で directory 内 file を recursive 取得
 *
 * Future scope (post-連休):
 *   - git_log: git log 履歴 ingestion
 *   - slack_export: Slack workspace export ingestion
 *   - notion_export: Notion workspace export ingestion
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { ObserverScope } from './config.js';

// === Result types ===

export interface IngestResult {
  scope_id: string;
  path: string;
  content: string;
  bytes: number;
}

export interface IngestError {
  scope_id: string;
  path?: string;
  error: string;
}

export type IngestOutcome = IngestResult | IngestError;

export function isIngestResult(r: IngestOutcome): r is IngestResult {
  return 'content' in r;
}

// === Path expansion ===

function expandHome(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return p.replace(/^~/, homedir());
  }
  return p;
}

// === File listing (recursive) ===

async function listFilesRecursive(dir: string, exclude: string[] = []): Promise<string[]> {
  const result: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip excluded paths
    if (exclude.some((ex) => fullPath.includes(ex))) continue;

    if (entry.isDirectory()) {
      // Skip common noise dirs
      if (['node_modules', '.git', '.cache', 'dist'].includes(entry.name)) continue;
      result.push(...(await listFilesRecursive(fullPath, exclude)));
    } else if (entry.isFile()) {
      result.push(fullPath);
    }
  }
  return result;
}

// === Glob matching (simple form, β scope) ===

function matchesGlob(path: string, pattern: string): boolean {
  // β scope: support common patterns only
  // Iwa 5/04 で minimatch / glob package 経由で full glob support に refactor candidate

  if (pattern === '**/*' || pattern === '*') return true;

  // Pattern with extension (e.g., **/*.md, *.md, **/*.{md,txt})
  const extMatch = pattern.match(/\*\*?\/?\*\.\{?([a-zA-Z0-9,]+)\}?$/);
  if (extMatch) {
    const exts = extMatch[1].split(',').map((e) => `.${e.trim()}`);
    return exts.some((ext) => path.endsWith(ext));
  }

  // Simple extension pattern (e.g., *.md → .md endswith)
  const simpleExtMatch = pattern.match(/\*\.([a-zA-Z0-9]+)$/);
  if (simpleExtMatch) {
    return path.endsWith(`.${simpleExtMatch[1]}`);
  }

  // Fallback: substring match
  return path.includes(pattern);
}

// === Sort by modification time (most recent first) ===

async function sortByMtimeDesc(paths: string[]): Promise<string[]> {
  const withStats = await Promise.all(
    paths.map(async (p) => {
      try {
        const s = await stat(p);
        return { path: p, mtime: s.mtimeMs };
      } catch {
        return { path: p, mtime: 0 };
      }
    }),
  );
  return withStats.sort((a, b) => b.mtime - a.mtime).map((s) => s.path);
}

// === Single scope ingestion ===

export async function ingestFileDirectory(scope: ObserverScope): Promise<IngestOutcome[]> {
  if (scope.type !== 'file_directory') {
    return [{ scope_id: scope.id, error: `Unsupported scope type: ${scope.type}` }];
  }

  const expandedPath = expandHome(scope.path);

  // Verify directory exists
  let dirStats;
  try {
    dirStats = await stat(expandedPath);
  } catch (err) {
    return [
      {
        scope_id: scope.id,
        path: expandedPath,
        error: `Directory not found: ${(err as Error).message}`,
      },
    ];
  }
  if (!dirStats.isDirectory()) {
    return [{ scope_id: scope.id, path: expandedPath, error: 'Not a directory' }];
  }

  // List files recursively + apply exclude
  let allFiles: string[];
  try {
    allFiles = await listFilesRecursive(expandedPath, scope.exclude);
  } catch (err) {
    return [
      {
        scope_id: scope.id,
        path: expandedPath,
        error: `Failed to list files: ${(err as Error).message}`,
      },
    ];
  }

  // Apply glob pattern filter
  const pattern = scope.glob;
  const filtered = allFiles.filter((f) => matchesGlob(f, pattern));

  // Sort by mtime desc (most recent first), apply max_files cap
  const sorted = await sortByMtimeDesc(filtered);
  const limited = sorted.slice(0, scope.max_files);

  // Read each file
  const results: IngestOutcome[] = [];
  for (const filePath of limited) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const bytes = Buffer.byteLength(content, 'utf-8');
      results.push({ scope_id: scope.id, path: filePath, content, bytes });
    } catch (err) {
      results.push({
        scope_id: scope.id,
        path: filePath,
        error: `Failed to read: ${(err as Error).message}`,
      });
    }
  }

  return results;
}

// === All scopes ingestion ===

export interface IngestSummary {
  total_files_read: number;
  total_files_failed: number;
  total_bytes_read: number;
  by_scope: Record<string, { files: number; bytes: number; errors: number }>;
}

export async function ingestAllScopes(
  scopes: ObserverScope[],
): Promise<{ outcomes: IngestOutcome[]; summary: IngestSummary }> {
  const outcomes: IngestOutcome[] = [];
  const summary: IngestSummary = {
    total_files_read: 0,
    total_files_failed: 0,
    total_bytes_read: 0,
    by_scope: {},
  };

  for (const scope of scopes) {
    const scopeResults = await ingestFileDirectory(scope);
    outcomes.push(...scopeResults);

    const stats = { files: 0, bytes: 0, errors: 0 };
    for (const r of scopeResults) {
      if (isIngestResult(r)) {
        stats.files += 1;
        stats.bytes += r.bytes;
        summary.total_files_read += 1;
        summary.total_bytes_read += r.bytes;
      } else {
        stats.errors += 1;
        summary.total_files_failed += 1;
      }
    }
    summary.by_scope[scope.id] = stats;
  }

  return { outcomes, summary };
}
