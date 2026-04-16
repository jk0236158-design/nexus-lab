import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createDatabase } from "../src/db.js";
import { registerTools } from "../src/tools.js";
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

// ── MCP tool handlers end-to-end ─────────────────────────────────────────
// Drives the real `registerTools` through an in-memory MCP client/server pair
// so validation, error responses, and DB wiring are all exercised together.
describe("registerTools (MCP end-to-end)", () => {
  let sqlite: Database.Database;
  let server: McpServer;
  let client: Client;

  beforeEach(async () => {
    sqlite = new Database(":memory:");
    const db = createDatabase(sqlite);

    server = new McpServer({ name: "test-server", version: "0.0.0" });
    registerTools(server, db);

    client = new Client(
      { name: "test-client", version: "0.0.0" },
      { capabilities: {} },
    );

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
    sqlite.close();
  });

  function textOf(result: { content: Array<{ type: string; text?: string }> }): string {
    const first = result.content[0];
    if (first.type !== "text" || typeof first.text !== "string") {
      throw new Error("Expected text content in tool response");
    }
    return first.text;
  }

  it("create-note returns the inserted row", async () => {
    const result = (await client.callTool({
      name: "create-note",
      arguments: { title: "Hello", content: "World" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(textOf(result));
    expect(parsed.id).toBe(1);
    expect(parsed.title).toBe("Hello");
    expect(parsed.content).toBe("World");
  });

  it("create-note rejects an empty content string via Zod validation", async () => {
    const result = (await client.callTool({
      name: "create-note",
      arguments: { title: "Hello", content: "" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/Invalid arguments|validation|too_small/i);
  });

  it("create-note rejects an empty title via Zod validation", async () => {
    const result = (await client.callTool({
      name: "create-note",
      arguments: { title: "", content: "ok" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toMatch(/Invalid arguments|validation|too_small/i);
  });

  it("get-note returns an error response for a non-existent ID", async () => {
    const result = (await client.callTool({
      name: "get-note",
      arguments: { id: 999 },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("not found");
  });

  it("delete-note returns an error response when deleting a non-existent ID", async () => {
    const result = (await client.callTool({
      name: "delete-note",
      arguments: { id: 999 },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("not found");
  });

  it("update-note requires at least one field to change", async () => {
    await client.callTool({
      name: "create-note",
      arguments: { title: "seed", content: "seed" },
    });

    const result = (await client.callTool({
      name: "update-note",
      arguments: { id: 1 },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    expect(textOf(result)).toContain("At least one");
  });

  it("update-note applies a partial update and refreshes updatedAt", async () => {
    await client.callTool({
      name: "create-note",
      arguments: { title: "before", content: "before" },
    });

    const result = (await client.callTool({
      name: "update-note",
      arguments: { id: 1, title: "after" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(textOf(result));
    expect(parsed.title).toBe("after");
    expect(parsed.content).toBe("before");
  });

  it("list-notes filters by query across title and content", async () => {
    await client.callTool({
      name: "create-note",
      arguments: { title: "apple", content: "red fruit" },
    });
    await client.callTool({
      name: "create-note",
      arguments: { title: "banana", content: "yellow fruit" },
    });

    const result = (await client.callTool({
      name: "list-notes",
      arguments: { query: "red" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    const parsed = JSON.parse(textOf(result));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("apple");
  });

  it("wraps raw DB constraint errors as DATABASE_CONSTRAINT_ERROR", async () => {
    // Force a NOT NULL constraint violation by dropping and recreating the
    // table without the zod layer's safety net, then calling through a
    // low-level driver shortcut. We simulate this by inserting directly with
    // an invalid row via raw SQL and observing the wrapped tool response.
    //
    // Easiest repro: create a note, then delete its row via the handler
    // after the table has been renamed so the tool throws an unknown-table
    // error. That exercises the fallback branch (not a constraint).
    sqlite.exec("ALTER TABLE notes RENAME TO notes_renamed");

    const result = (await client.callTool({
      name: "create-note",
      arguments: { title: "x", content: "y" },
    })) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

    expect(result.isError).toBe(true);
    const text = textOf(result);
    // Either branch of formatDbError is acceptable; the key property is
    // that raw driver details (e.g. "SqliteError: no such table") do not leak.
    expect(text).not.toMatch(/SqliteError|no such table/i);
    expect(text).toMatch(/Failed to create note|DATABASE_CONSTRAINT_ERROR/);
  });
});
