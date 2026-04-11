/**
 * SQL schema definitions for Zen Memory Server.
 * These are executed on database initialization to create tables if they don't exist.
 */

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('knot', 'decision', 'learning', 'observation', 'context')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    importance INTEGER DEFAULT 0,
    session_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS knot_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_id INTEGER REFERENCES memories(id),
    knot_id TEXT UNIQUE NOT NULL,
    trigger_json TEXT NOT NULL,
    effect_json TEXT NOT NULL,
    compensation_json TEXT,
    hardness TEXT DEFAULT 'L0',
    observed_count INTEGER DEFAULT 1,
    last_observed TEXT
  );

  CREATE TABLE IF NOT EXISTS session_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date TEXT UNIQUE NOT NULL,
    output_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    quality_score INTEGER,
    delegation_ratio REAL,
    knot_activations TEXT,
    notes TEXT
  );
`;

/**
 * Memory type enum values.
 */
export const MEMORY_TYPES = [
  "knot",
  "decision",
  "learning",
  "observation",
  "context",
] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];

/**
 * Hardness levels for knot records, from softest to crystallized.
 */
export const HARDNESS_LEVELS = ["L0", "L1", "L2", "L3", "LC"] as const;
export type HardnessLevel = (typeof HARDNESS_LEVELS)[number];

export const HARDNESS_ORDER: Record<string, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  LC: 4,
};

// Row type interfaces
export interface MemoryRow {
  id: number;
  type: string;
  title: string;
  content: string;
  tags: string | null;
  importance: number;
  session_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnotRow {
  id: number;
  memory_id: number | null;
  knot_id: string;
  trigger_json: string;
  effect_json: string;
  compensation_json: string | null;
  hardness: string;
  observed_count: number;
  last_observed: string | null;
}

export interface MetricsRow {
  id: number;
  session_date: string;
  output_count: number;
  error_count: number;
  quality_score: number | null;
  delegation_ratio: number | null;
  knot_activations: string | null;
  notes: string | null;
}
