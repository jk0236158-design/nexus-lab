import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createDatabase, type AppDatabase } from "../src/db.js";
import type { MemoryRow, KnotRow, MetricsRow } from "../src/schema.js";

let appDb: AppDatabase;

// Helper: run a query and return typed rows
function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  const stmt = appDb.sqlDb.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return queryAll<T>(sql, params)[0];
}

beforeEach(async () => {
  // Use in-memory database for tests — fast and isolated
  appDb = await createDatabase(":memory:");
});

afterEach(() => {
  appDb.close();
});

describe("Database initialization", () => {
  it("should create all three tables", () => {
    const tables = queryAll<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    );

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain("memories");
    expect(tableNames).toContain("knot_records");
    expect(tableNames).toContain("session_metrics");
  });
});

describe("Memories CRUD", () => {
  it("should insert a memory", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content, tags, importance)
       VALUES (?, ?, ?, ?, ?)`,
      ["decision", "Use sql.js", "Chose sql.js for cross-platform support", '["architecture","db"]', 7]
    );

    const row = queryOne<MemoryRow>("SELECT * FROM memories WHERE id = 1");

    expect(row).toBeDefined();
    expect(row!.type).toBe("decision");
    expect(row!.title).toBe("Use sql.js");
    expect(row!.importance).toBe(7);
    expect(JSON.parse(row!.tags!)).toEqual(["architecture", "db"]);
  });

  it("should reject invalid memory types", () => {
    expect(() => {
      appDb.sqlDb.run(
        `INSERT INTO memories (type, title, content) VALUES (?, ?, ?)`,
        ["invalid_type", "Bad", "Should fail"]
      );
    }).toThrow();
  });

  it("should retrieve memories by type", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('decision', 'A', 'Content A')`
    );
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('learning', 'B', 'Content B')`
    );
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('decision', 'C', 'Content C')`
    );

    const decisions = queryAll<MemoryRow>(
      "SELECT * FROM memories WHERE type = ?",
      ["decision"]
    );

    expect(decisions.length).toBe(2);
  });

  it("should delete a memory", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('observation', 'Test', 'Temp')`
    );

    const inserted = queryOne<MemoryRow>("SELECT * FROM memories WHERE id = 1");
    expect(inserted).toBeDefined();

    appDb.sqlDb.run("DELETE FROM memories WHERE id = ?", [1]);

    const found = queryOne<MemoryRow>("SELECT * FROM memories WHERE id = ?", [1]);
    expect(found).toBeUndefined();
  });

  it("should search memories with LIKE", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('learning', 'TypeScript generics', 'Learned about conditional types and infer keyword')`
    );
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('learning', 'Rust ownership', 'Borrow checker prevents data races at compile time')`
    );

    const results = queryAll<MemoryRow>(
      `SELECT * FROM memories WHERE title LIKE ? OR content LIKE ?`,
      ["%TypeScript%", "%TypeScript%"]
    );

    expect(results.length).toBe(1);
    expect(results[0].title).toBe("TypeScript generics");
  });

  it("should search memories by tag using LIKE on JSON", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content, tags) VALUES ('decision', 'Pick ORM', 'Chose drizzle', '["architecture","orm"]')`
    );
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content, tags) VALUES ('learning', 'CSS Grid', 'Grid is powerful', '["frontend","css"]')`
    );

    const results = queryAll<MemoryRow>(
      `SELECT * FROM memories WHERE tags LIKE ?`,
      ['%"architecture"%']
    );

    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Pick ORM");
  });

  it("should have default timestamps", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('context', 'Timestamp test', 'Check defaults')`
    );

    const row = queryOne<MemoryRow>("SELECT * FROM memories WHERE id = 1");
    expect(row!.created_at).toBeTruthy();
    expect(row!.updated_at).toBeTruthy();
  });
});

describe("Knot records", () => {
  it("should create a knot linked to a memory", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('knot', 'Knot: overcommit', 'Tendency to take on too many tasks')`
    );

    appDb.sqlDb.run(
      `INSERT INTO knot_records (memory_id, knot_id, trigger_json, effect_json, hardness, observed_count, last_observed)
       VALUES (1, 'op_knot_overcommit', ?, ?, 'L1', 1, ?)`,
      [
        JSON.stringify({ context: "multiple requests" }),
        JSON.stringify({ result: "quality drops" }),
        new Date().toISOString(),
      ]
    );

    const knot = queryOne<KnotRow>(
      "SELECT * FROM knot_records WHERE knot_id = ?",
      ["op_knot_overcommit"]
    );

    expect(knot).toBeDefined();
    expect(knot!.memory_id).toBe(1);
    expect(knot!.hardness).toBe("L1");
    expect(knot!.observed_count).toBe(1);
  });

  it("should enforce unique knot_id constraint", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('knot', 'K1', 'C1')`
    );

    appDb.sqlDb.run(
      `INSERT INTO knot_records (memory_id, knot_id, trigger_json, effect_json) VALUES (1, 'unique_knot', '{}', '{}')`
    );

    expect(() => {
      appDb.sqlDb.run(
        `INSERT INTO knot_records (memory_id, knot_id, trigger_json, effect_json) VALUES (1, 'unique_knot', '{}', '{}')`
      );
    }).toThrow();
  });

  it("should increment observed_count on update", () => {
    appDb.sqlDb.run(
      `INSERT INTO memories (type, title, content) VALUES ('knot', 'K1', 'C1')`
    );
    appDb.sqlDb.run(
      `INSERT INTO knot_records (memory_id, knot_id, trigger_json, effect_json, observed_count)
       VALUES (1, 'count_knot', '{}', '{}', 1)`
    );

    appDb.sqlDb.run(
      `UPDATE knot_records SET observed_count = observed_count + 1 WHERE knot_id = ?`,
      ["count_knot"]
    );

    const knot = queryOne<KnotRow>(
      "SELECT * FROM knot_records WHERE knot_id = ?",
      ["count_knot"]
    );
    expect(knot!.observed_count).toBe(2);
  });

  it("should enforce foreign key on memory_id", () => {
    // memory_id 999 does not exist
    expect(() => {
      appDb.sqlDb.run(
        `INSERT INTO knot_records (memory_id, knot_id, trigger_json, effect_json) VALUES (999, 'fk_test', '{}', '{}')`
      );
    }).toThrow();
  });
});

describe("Session metrics", () => {
  it("should insert and retrieve session metrics", () => {
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio, notes)
       VALUES ('2026-04-10', 15, 2, 4, 0.3, 'Productive session')`
    );

    const result = queryOne<MetricsRow>(
      "SELECT * FROM session_metrics WHERE session_date = ?",
      ["2026-04-10"]
    );

    expect(result).toBeDefined();
    expect(result!.output_count).toBe(15);
    expect(result!.quality_score).toBe(4);
    expect(result!.delegation_ratio).toBeCloseTo(0.3);
  });

  it("should enforce unique session_date constraint", () => {
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio)
       VALUES ('2026-04-10', 10, 0, 5, 0.5)`
    );

    expect(() => {
      appDb.sqlDb.run(
        `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio)
         VALUES ('2026-04-10', 5, 1, 3, 0.2)`
      );
    }).toThrow();
  });

  it("should allow INSERT OR REPLACE for upsert behavior", () => {
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio)
       VALUES ('2026-04-10', 10, 0, 5, 0.5)`
    );

    // This should replace the existing row
    appDb.sqlDb.run(
      `INSERT OR REPLACE INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio)
       VALUES ('2026-04-10', 20, 1, 4, 0.6)`
    );

    const result = queryOne<MetricsRow>(
      "SELECT * FROM session_metrics WHERE session_date = ?",
      ["2026-04-10"]
    );
    expect(result!.output_count).toBe(20);
    expect(result!.quality_score).toBe(4);
  });

  it("should retrieve metrics ordered by date descending", () => {
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio) VALUES ('2026-04-08', 10, 1, 3, 0.4)`
    );
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio) VALUES ('2026-04-10', 20, 0, 5, 0.6)`
    );
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio) VALUES ('2026-04-09', 15, 2, 4, 0.5)`
    );

    const results = queryAll<MetricsRow>(
      "SELECT * FROM session_metrics ORDER BY session_date DESC LIMIT 3"
    );

    expect(results[0].session_date).toBe("2026-04-10");
    expect(results[1].session_date).toBe("2026-04-09");
    expect(results[2].session_date).toBe("2026-04-08");
  });

  it("should store knot_activations as JSON", () => {
    const activations = ["op_knot_overcommit", "op_knot_perfectionism"];
    appDb.sqlDb.run(
      `INSERT INTO session_metrics (session_date, output_count, error_count, quality_score, delegation_ratio, knot_activations)
       VALUES ('2026-04-10', 10, 0, 4, 0.5, ?)`,
      [JSON.stringify(activations)]
    );

    const result = queryOne<MetricsRow>(
      "SELECT * FROM session_metrics WHERE session_date = ?",
      ["2026-04-10"]
    );
    expect(JSON.parse(result!.knot_activations!)).toEqual(activations);
  });
});
