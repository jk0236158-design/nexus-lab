import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { db as defaultDb } from "./db.js";
import { notes } from "./schema.js";
import type * as schema from "./schema.js";

type Db = BetterSQLite3Database<typeof schema>;

/** Database schema description exposed as a resource. */
const SCHEMA_DESCRIPTION = `# Database Schema

## Table: notes

| Column     | Type    | Constraints                         |
|------------|---------|-------------------------------------|
| id         | INTEGER | PRIMARY KEY, AUTOINCREMENT          |
| title      | TEXT    | NOT NULL                            |
| content    | TEXT    | NOT NULL, DEFAULT ''                |
| created_at | TEXT    | NOT NULL, DEFAULT datetime('now')   |
| updated_at | TEXT    | NOT NULL, DEFAULT datetime('now')   |

### Notes
- Timestamps are stored as ISO 8601 strings (SQLite has no native datetime type).
- WAL journal mode is enabled for better concurrent read performance.
- Foreign keys are enforced.
`;

/**
 * Register all resources on the given MCP server.
 * Accepts an optional database override for testing.
 */
export function registerResources(server: McpServer, database?: Db): void {
  const db = database ?? defaultDb;

  // ── notes://list ─────────────────────────────────────────────────────
  server.resource("notes-list", "notes://list", {
    description: "List all notes in the database as JSON",
    mimeType: "application/json",
  }, async () => {
    const allNotes = db.select().from(notes).all();

    return {
      contents: [
        {
          uri: "notes://list",
          mimeType: "application/json",
          text: JSON.stringify(allNotes, null, 2),
        },
      ],
    };
  });

  // ── db://schema ──────────────────────────────────────────────────────
  server.resource("db-schema", "db://schema", {
    description: "Database schema documentation",
    mimeType: "text/markdown",
  }, async () => {
    return {
      contents: [
        {
          uri: "db://schema",
          mimeType: "text/markdown",
          text: SCHEMA_DESCRIPTION,
        },
      ],
    };
  });
}
