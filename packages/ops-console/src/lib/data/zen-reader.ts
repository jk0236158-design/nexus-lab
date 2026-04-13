import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import type { UnifiedKnot, SessionMetrics } from '../types';

const DB_PATH = process.env.ZEN_DB_PATH || 'C:\\Users\\jk023\\.zen\\memory.db';

function openDb(): Database.Database | null {
  if (!existsSync(DB_PATH)) return null;
  try {
    return new Database(DB_PATH, { readonly: true });
  } catch {
    return null;
  }
}

export function getZenKnots(): UnifiedKnot[] {
  const db = openDb();
  if (!db) return [];

  try {
    const rows = db.prepare(`
      SELECT
        k.id,
        k.knot_id,
        k.trigger_json,
        k.effect_json,
        k.compensation_json,
        k.hardness,
        k.observed_count,
        k.last_observed,
        m.title,
        m.content,
        m.created_at
      FROM knot_records k
      LEFT JOIN memories m ON k.memory_id = m.id
    `).all() as Array<{
      id: number;
      knot_id: string;
      trigger_json: string;
      effect_json: string;
      compensation_json: string | null;
      hardness: string;
      observed_count: number;
      last_observed: string | null;
      title: string | null;
      content: string | null;
      created_at: string | null;
    }>;

    return rows.map((row) => ({
      id: row.knot_id,
      agent: 'zen' as const,
      type: 'knot',
      description: row.title
        ? `${row.title}${row.content ? ' — ' + row.content : ''}`
        : row.knot_id,
      trigger: safeJsonParse(row.trigger_json),
      effect: safeJsonParse(row.effect_json),
      compensation: row.compensation_json
        ? safeJsonParse(row.compensation_json)
        : null,
      hardness: normalizeHardness(row.hardness),
      observedCount: row.observed_count ?? 0,
      firstObserved: row.created_at ?? null,
      lastObserved: row.last_observed ?? null,
    }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}

export function getSessionMetrics(): SessionMetrics[] {
  const db = openDb();
  if (!db) return [];

  try {
    const rows = db.prepare(`
      SELECT
        session_date,
        output_count,
        error_count,
        quality_score,
        delegation_ratio,
        knot_activations,
        notes
      FROM session_metrics
      ORDER BY session_date DESC
    `).all() as Array<{
      session_date: string;
      output_count: number;
      error_count: number;
      quality_score: number;
      delegation_ratio: number;
      knot_activations: string | null;
      notes: string | null;
    }>;

    return rows.map((row) => ({
      sessionDate: row.session_date,
      outputCount: row.output_count,
      errorCount: row.error_count,
      qualityScore: row.quality_score,
      delegationRatio: row.delegation_ratio,
      knotActivations: safeJsonParseArray(row.knot_activations),
      notes: row.notes ?? '',
    }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}

function safeJsonParse(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function safeJsonParseArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeHardness(
  h: string,
): 'L0' | 'L1' | 'L2' | 'L3' | 'LC' {
  const valid = ['L0', 'L1', 'L2', 'L3', 'LC'];
  return valid.includes(h) ? (h as 'L0' | 'L1' | 'L2' | 'L3' | 'LC') : 'L0';
}
