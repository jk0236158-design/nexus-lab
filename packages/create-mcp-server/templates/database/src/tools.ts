import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { eq, like, or, sql } from "drizzle-orm";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { db as defaultDb } from "./db.js";
import { notes } from "./schema.js";
import type * as schema from "./schema.js";

type Db = BetterSQLite3Database<typeof schema>;

/**
 * Register all CRUD tools on the given MCP server.
 * Accepts an optional database override for testing.
 */
export function registerTools(server: McpServer, database?: Db): void {
  const db = database ?? defaultDb;

  // ── create-note ──────────────────────────────────────────────────────
  server.tool(
    "create-note",
    "Create a new note with a title and optional content",
    {
      title: z.string().min(1).max(500).describe("Title of the note"),
      content: z
        .string()
        .max(50_000)
        .default("")
        .describe("Body content of the note"),
    },
    async ({ title, content }) => {
      try {
        const result = db
          .insert(notes)
          .values({ title, content })
          .returning()
          .get();

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to create note: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ── list-notes ───────────────────────────────────────────────────────
  server.tool(
    "list-notes",
    "List all notes, optionally filtered by a search query on title or content",
    {
      query: z
        .string()
        .optional()
        .describe("Search term to filter notes by title or content"),
    },
    async ({ query }) => {
      try {
        let result;

        if (query) {
          const pattern = `%${query}%`;
          result = db
            .select()
            .from(notes)
            .where(
              or(like(notes.title, pattern), like(notes.content, pattern)),
            )
            .all();
        } else {
          result = db.select().from(notes).all();
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to list notes: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ── get-note ─────────────────────────────────────────────────────────
  server.tool(
    "get-note",
    "Retrieve a single note by its ID",
    {
      id: z.number().int().positive().describe("ID of the note to retrieve"),
    },
    async ({ id }) => {
      try {
        const result = db
          .select()
          .from(notes)
          .where(eq(notes.id, id))
          .get();

        if (!result) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Note with ID ${id} not found`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get note: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ── update-note ──────────────────────────────────────────────────────
  server.tool(
    "update-note",
    "Update an existing note by ID. Provide at least one of title or content.",
    {
      id: z.number().int().positive().describe("ID of the note to update"),
      title: z
        .string()
        .min(1)
        .max(500)
        .optional()
        .describe("New title for the note"),
      content: z
        .string()
        .max(50_000)
        .optional()
        .describe("New content for the note"),
    },
    async ({ id, title, content }) => {
      try {
        if (title === undefined && content === undefined) {
          return {
            content: [
              {
                type: "text" as const,
                text: "At least one of 'title' or 'content' must be provided",
              },
            ],
            isError: true,
          };
        }

        // Check existence first
        const existing = db
          .select()
          .from(notes)
          .where(eq(notes.id, id))
          .get();

        if (!existing) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Note with ID ${id} not found`,
              },
            ],
            isError: true,
          };
        }

        const updates: Record<string, unknown> = {
          updatedAt: sql`datetime('now')`,
        };
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;

        const result = db
          .update(notes)
          .set(updates)
          .where(eq(notes.id, id))
          .returning()
          .get();

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to update note: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ── delete-note ──────────────────────────────────────────────────────
  server.tool(
    "delete-note",
    "Delete a note by its ID",
    {
      id: z.number().int().positive().describe("ID of the note to delete"),
    },
    async ({ id }) => {
      try {
        const existing = db
          .select()
          .from(notes)
          .where(eq(notes.id, id))
          .get();

        if (!existing) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Note with ID ${id} not found`,
              },
            ],
            isError: true,
          };
        }

        db.delete(notes).where(eq(notes.id, id)).run();

        return {
          content: [
            {
              type: "text" as const,
              text: `Note with ID ${id} deleted successfully`,
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to delete note: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
