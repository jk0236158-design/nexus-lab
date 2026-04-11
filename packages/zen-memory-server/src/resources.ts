import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppDatabase } from "./db.js";
import {
  HARDNESS_ORDER,
  type MemoryRow,
  type KnotRow,
  type MetricsRow,
} from "./schema.js";

/**
 * Register all MCP resources on the server.
 */
export function registerResources(server: McpServer, appDb: AppDatabase) {
  const { sqlDb } = appDb;

  // Helper: run a query and return typed rows
  function queryAll<T>(sql: string, params: unknown[] = []): T[] {
    const stmt = sqlDb.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  // ── memory://recent ──────────────────────────────────────────────────
  server.resource(
    "recent-memories",
    "memory://recent",
    {
      description: "Last 20 memories across all types",
      mimeType: "application/json",
    },
    async () => {
      const rows = queryAll<MemoryRow>(
        "SELECT * FROM memories ORDER BY created_at DESC LIMIT 20"
      );

      return {
        contents: [
          {
            uri: "memory://recent",
            mimeType: "application/json",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }
  );

  // ── memory://knots ───────────────────────────────────────────────────
  server.resource(
    "all-knots",
    "memory://knots",
    {
      description: "All knots sorted by hardness level (highest first)",
      mimeType: "application/json",
    },
    async () => {
      const rows = queryAll<KnotRow>("SELECT * FROM knot_records");

      // Sort by hardness descending
      rows.sort(
        (a, b) =>
          (HARDNESS_ORDER[b.hardness ?? "L0"] ?? 0) -
          (HARDNESS_ORDER[a.hardness ?? "L0"] ?? 0)
      );

      return {
        contents: [
          {
            uri: "memory://knots",
            mimeType: "application/json",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }
  );

  // ── memory://metrics ─────────────────────────────────────────────────
  server.resource(
    "recent-metrics",
    "memory://metrics",
    {
      description: "Last 7 session metrics",
      mimeType: "application/json",
    },
    async () => {
      const rows = queryAll<MetricsRow>(
        "SELECT * FROM session_metrics ORDER BY session_date DESC LIMIT 7"
      );

      return {
        contents: [
          {
            uri: "memory://metrics",
            mimeType: "application/json",
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }
  );
}
