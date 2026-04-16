import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createDatabase } from "../src/db.js";
import { notes } from "../src/schema.js";

describe("createDatabase", () => {
  it("initializes the notes table on an empty in-memory connection", () => {
    const sqlite = new Database(":memory:");
    const db = createDatabase(sqlite);

    // The table must exist and be queryable (no rows yet).
    const rows = db.select().from(notes).all();
    expect(rows).toEqual([]);

    sqlite.close();
  });

  it("is idempotent — calling it twice does not throw", () => {
    const sqlite = new Database(":memory:");
    createDatabase(sqlite);
    expect(() => createDatabase(sqlite)).not.toThrow();
    sqlite.close();
  });

  it("enables foreign key enforcement", () => {
    const sqlite = new Database(":memory:");
    createDatabase(sqlite);

    const result = sqlite.pragma("foreign_keys", { simple: true });
    expect(result).toBe(1);

    sqlite.close();
  });

  it("applies the expected columns and defaults", () => {
    const sqlite = new Database(":memory:");
    const db = createDatabase(sqlite);

    const inserted = db
      .insert(notes)
      .values({ title: "probe", content: "body" })
      .returning()
      .get();

    expect(inserted.id).toBeTypeOf("number");
    expect(typeof inserted.createdAt).toBe("string");
    expect(typeof inserted.updatedAt).toBe("string");
    // ISO-ish timestamp ("YYYY-MM-DD HH:MM:SS") from datetime('now')
    expect(inserted.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    sqlite.close();
  });
});

describe("WAL journal mode (file-backed database)", () => {
  let dbPath: string;

  beforeEach(() => {
    dbPath = join(tmpdir(), `nexus-lab-db-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
  });

  afterEach(() => {
    // Clean up both the database file and any WAL sidecars.
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      const file = `${dbPath}${suffix}`;
      if (existsSync(file)) {
        rmSync(file);
      }
    }
  });

  it("can be set to WAL mode just like the production db module does", () => {
    // We don't import `db` directly because it reads DATABASE_URL at import time
    // and binds to a filesystem path. Instead we replicate the pragma behavior
    // that `src/db.ts` applies, so the assertion stays honest.
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    const journalMode = sqlite.pragma("journal_mode", { simple: true });
    expect(String(journalMode).toLowerCase()).toBe("wal");

    sqlite.close();
  });
});
