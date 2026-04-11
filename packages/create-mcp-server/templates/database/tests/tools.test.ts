import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDatabase } from "../src/db.js";
import { notes } from "../src/schema.js";
import { eq } from "drizzle-orm";

// We test the database operations directly rather than going through MCP
// protocol to keep tests fast and focused on business logic.

function createTestDb() {
  const sqlite = new Database(":memory:");
  const db = createDatabase(sqlite);
  return { sqlite, db };
}

describe("Notes CRUD operations", () => {
  let sqlite: Database.Database;
  let db: ReturnType<typeof createDatabase>;

  beforeEach(() => {
    const testDb = createTestDb();
    sqlite = testDb.sqlite;
    db = testDb.db;
  });

  afterEach(() => {
    sqlite.close();
  });

  describe("create", () => {
    it("should create a note with title and content", () => {
      const result = db
        .insert(notes)
        .values({ title: "Test Note", content: "Hello world" })
        .returning()
        .get();

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.title).toBe("Test Note");
      expect(result.content).toBe("Hello world");
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it("should create a note with default empty content", () => {
      const result = db
        .insert(notes)
        .values({ title: "Title Only" })
        .returning()
        .get();

      expect(result.content).toBe("");
    });

    it("should auto-increment IDs", () => {
      const first = db
        .insert(notes)
        .values({ title: "First" })
        .returning()
        .get();
      const second = db
        .insert(notes)
        .values({ title: "Second" })
        .returning()
        .get();

      expect(second.id).toBe(first.id + 1);
    });
  });

  describe("read", () => {
    beforeEach(() => {
      db.insert(notes)
        .values([
          { title: "Note A", content: "Alpha content" },
          { title: "Note B", content: "Beta content" },
          { title: "Note C", content: "Gamma content" },
        ])
        .run();
    });

    it("should list all notes", () => {
      const result = db.select().from(notes).all();

      expect(result).toHaveLength(3);
      expect(result.map((n) => n.title)).toEqual([
        "Note A",
        "Note B",
        "Note C",
      ]);
    });

    it("should get a note by ID", () => {
      const result = db.select().from(notes).where(eq(notes.id, 2)).get();

      expect(result).toBeDefined();
      expect(result!.title).toBe("Note B");
    });

    it("should return undefined for a non-existent ID", () => {
      const result = db.select().from(notes).where(eq(notes.id, 999)).get();

      expect(result).toBeUndefined();
    });

    it("should search notes by title pattern", () => {
      const result = db
        .select()
        .from(notes)
        .where(eq(notes.title, "Note A"))
        .all();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Note A");
    });
  });

  describe("update", () => {
    beforeEach(() => {
      db.insert(notes)
        .values({ title: "Original Title", content: "Original Content" })
        .run();
    });

    it("should update the title of a note", () => {
      const result = db
        .update(notes)
        .set({ title: "Updated Title" })
        .where(eq(notes.id, 1))
        .returning()
        .get();

      expect(result.title).toBe("Updated Title");
      expect(result.content).toBe("Original Content");
    });

    it("should update the content of a note", () => {
      const result = db
        .update(notes)
        .set({ content: "Updated Content" })
        .where(eq(notes.id, 1))
        .returning()
        .get();

      expect(result.title).toBe("Original Title");
      expect(result.content).toBe("Updated Content");
    });

    it("should update both title and content", () => {
      const result = db
        .update(notes)
        .set({ title: "New Title", content: "New Content" })
        .where(eq(notes.id, 1))
        .returning()
        .get();

      expect(result.title).toBe("New Title");
      expect(result.content).toBe("New Content");
    });
  });

  describe("delete", () => {
    beforeEach(() => {
      db.insert(notes)
        .values([
          { title: "Keep", content: "Stay" },
          { title: "Remove", content: "Gone" },
        ])
        .run();
    });

    it("should delete a note by ID", () => {
      db.delete(notes).where(eq(notes.id, 2)).run();

      const remaining = db.select().from(notes).all();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe("Keep");
    });

    it("should not affect other notes when deleting", () => {
      db.delete(notes).where(eq(notes.id, 1)).run();

      const remaining = db.select().from(notes).all();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].title).toBe("Remove");
    });

    it("should handle deleting a non-existent ID gracefully", () => {
      db.delete(notes).where(eq(notes.id, 999)).run();

      const remaining = db.select().from(notes).all();
      expect(remaining).toHaveLength(2);
    });
  });
});
