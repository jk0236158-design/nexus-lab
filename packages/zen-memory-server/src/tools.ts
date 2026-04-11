import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AppDatabase } from "./db.js";
import {
  HARDNESS_ORDER,
  type MemoryRow,
  type KnotRow,
  type MetricsRow,
} from "./schema.js";

/**
 * Register all MCP tools on the server.
 */
export function registerTools(server: McpServer, appDb: AppDatabase) {
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

  // Helper: run a query and return first row
  function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    const rows = queryAll<T>(sql, params);
    return rows[0];
  }

  // ── remember ─────────────────────────────────────────────────────────
  server.tool(
    "remember",
    "Save a new memory entry (decision, learning, observation, context, or knot)",
    {
      type: z.enum(["knot", "decision", "learning", "observation", "context"]),
      title: z.string().min(1).describe("Short title for the memory"),
      content: z.string().min(1).describe("Detailed content of the memory"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags for categorization"),
      importance: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .describe("Importance level 0-10"),
      session_date: z
        .string()
        .optional()
        .describe("Date of the session (YYYY-MM-DD)"),
    },
    async (params) => {
      try {
        sqlDb.run(
          `INSERT INTO memories (type, title, content, tags, importance, session_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            params.type,
            params.title,
            params.content,
            params.tags ? JSON.stringify(params.tags) : null,
            params.importance ?? 0,
            params.session_date ?? null,
          ]
        );

        const row = queryOne<{ id: number }>(
          "SELECT last_insert_rowid() as id"
        );
        const id = row?.id ?? 0;

        appDb.save();

        return {
          content: [
            {
              type: "text" as const,
              text: `Memory saved with ID ${id}: "${params.title}"`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── recall ───────────────────────────────────────────────────────────
  server.tool(
    "recall",
    "Search memories by query (LIKE match on title and content)",
    {
      query: z.string().min(1).describe("Search query"),
      type: z
        .enum(["knot", "decision", "learning", "observation", "context"])
        .optional()
        .describe("Filter by memory type"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max results (default 10)"),
    },
    async (params) => {
      try {
        const maxResults = params.limit ?? 10;
        const likePattern = `%${params.query}%`;

        let sql: string;
        let sqlParams: unknown[];

        if (params.type) {
          sql = `SELECT * FROM memories
                 WHERE (title LIKE ? OR content LIKE ?) AND type = ?
                 ORDER BY importance DESC, created_at DESC
                 LIMIT ?`;
          sqlParams = [likePattern, likePattern, params.type, maxResults];
        } else {
          sql = `SELECT * FROM memories
                 WHERE title LIKE ? OR content LIKE ?
                 ORDER BY importance DESC, created_at DESC
                 LIMIT ?`;
          sqlParams = [likePattern, likePattern, maxResults];
        }

        const rows = queryAll<MemoryRow>(sql, sqlParams);

        if (rows.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No memories found for query: "${params.query}"`,
              },
            ],
          };
        }

        const text = rows
          .map(
            (r) =>
              `[${r.id}] (${r.type}) ${r.title}\n  ${r.content}\n  tags: ${r.tags ?? "none"} | importance: ${r.importance} | date: ${r.session_date ?? r.created_at}`
          )
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── recall-by-tag ────────────────────────────────────────────────────
  server.tool(
    "recall-by-tag",
    "Retrieve memories that contain a specific tag",
    {
      tag: z.string().min(1).describe("Tag to search for"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Max results (default 10)"),
    },
    async (params) => {
      try {
        const maxResults = params.limit ?? 10;

        // Search within JSON array stored in tags column
        const rows = queryAll<MemoryRow>(
          `SELECT * FROM memories WHERE tags LIKE ? ORDER BY created_at DESC LIMIT ?`,
          [`%"${params.tag}"%`, maxResults]
        );

        if (rows.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No memories found with tag: "${params.tag}"`,
              },
            ],
          };
        }

        const text = rows
          .map(
            (r) =>
              `[${r.id}] (${r.type}) ${r.title}\n  ${r.content}\n  tags: ${r.tags} | importance: ${r.importance}`
          )
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── forget ───────────────────────────────────────────────────────────
  server.tool(
    "forget",
    "Delete a memory entry by its ID",
    {
      id: z.number().int().positive().describe("Memory ID to delete"),
    },
    async (params) => {
      try {
        // Get the memory first so we can confirm deletion
        const existing = queryOne<MemoryRow>(
          "SELECT * FROM memories WHERE id = ?",
          [params.id]
        );

        if (!existing) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No memory found with ID ${params.id}`,
              },
            ],
            isError: true,
          };
        }

        // Remove linked knot record if any
        sqlDb.run("DELETE FROM knot_records WHERE memory_id = ?", [params.id]);
        // Remove the memory itself
        sqlDb.run("DELETE FROM memories WHERE id = ?", [params.id]);

        appDb.save();

        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted memory [${existing.id}]: "${existing.title}"`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── record-knot ──────────────────────────────────────────────────────
  server.tool(
    "record-knot",
    "Save or update a behavioral knot pattern. If the knot_id already exists, increments observed_count and updates last_observed.",
    {
      knot_id: z
        .string()
        .min(1)
        .describe('Unique knot identifier, e.g. "op_knot_session_overload"'),
      trigger: z.object({}).passthrough().describe("Trigger conditions"),
      effect: z.object({}).passthrough().describe("Effects of the knot"),
      compensation: z
        .object({})
        .passthrough()
        .optional()
        .describe("Compensation strategies"),
      hardness: z
        .enum(["L0", "L1", "L2", "L3", "LC"])
        .optional()
        .describe("Hardness level (default L0)"),
      memory_title: z
        .string()
        .optional()
        .describe("Title for the associated memory entry"),
      memory_content: z
        .string()
        .optional()
        .describe("Content for the associated memory entry"),
    },
    async (params) => {
      try {
        const now = new Date().toISOString();

        // Check if knot already exists
        const existing = queryOne<KnotRow>(
          "SELECT * FROM knot_records WHERE knot_id = ?",
          [params.knot_id]
        );

        if (existing) {
          // Update existing knot
          sqlDb.run(
            `UPDATE knot_records SET
               observed_count = observed_count + 1,
               last_observed = ?,
               trigger_json = ?,
               effect_json = ?,
               compensation_json = COALESCE(?, compensation_json),
               hardness = COALESCE(?, hardness)
             WHERE knot_id = ?`,
            [
              now,
              JSON.stringify(params.trigger),
              JSON.stringify(params.effect),
              params.compensation
                ? JSON.stringify(params.compensation)
                : null,
              params.hardness ?? null,
              params.knot_id,
            ]
          );

          appDb.save();

          const updated = queryOne<KnotRow>(
            "SELECT * FROM knot_records WHERE knot_id = ?",
            [params.knot_id]
          );

          return {
            content: [
              {
                type: "text" as const,
                text: `Knot "${params.knot_id}" updated. Observed ${updated?.observed_count} times. Hardness: ${updated?.hardness}`,
              },
            ],
          };
        }

        // Create new memory entry for the knot
        const title = params.memory_title ?? `Knot: ${params.knot_id}`;
        const content =
          params.memory_content ??
          `Behavioral pattern "${params.knot_id}" observed.`;

        sqlDb.run(
          `INSERT INTO memories (type, title, content, importance)
           VALUES ('knot', ?, ?, 5)`,
          [title, content]
        );

        const memRow = queryOne<{ id: number }>(
          "SELECT last_insert_rowid() as id"
        );
        const memoryId = memRow?.id ?? 0;

        // Create knot record linked to memory
        sqlDb.run(
          `INSERT INTO knot_records (memory_id, knot_id, trigger_json, effect_json, compensation_json, hardness, observed_count, last_observed)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            memoryId,
            params.knot_id,
            JSON.stringify(params.trigger),
            JSON.stringify(params.effect),
            params.compensation
              ? JSON.stringify(params.compensation)
              : null,
            params.hardness ?? "L0",
            now,
          ]
        );

        appDb.save();

        return {
          content: [
            {
              type: "text" as const,
              text: `New knot "${params.knot_id}" recorded (memory ID: ${memoryId}). Hardness: ${params.hardness ?? "L0"}`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── get-knots ────────────────────────────────────────────────────────
  server.tool(
    "get-knots",
    "List all knots, optionally filtered by minimum hardness level",
    {
      min_hardness: z
        .enum(["L0", "L1", "L2", "L3", "LC"])
        .optional()
        .describe("Minimum hardness level to include"),
    },
    async (params) => {
      try {
        const rows = queryAll<KnotRow>("SELECT * FROM knot_records");

        let filtered = rows;
        if (params.min_hardness) {
          const minLevel = HARDNESS_ORDER[params.min_hardness] ?? 0;
          filtered = rows.filter(
            (r) => (HARDNESS_ORDER[r.hardness ?? "L0"] ?? 0) >= minLevel
          );
        }

        // Sort by hardness descending, then observed_count descending
        filtered.sort((a, b) => {
          const hardDiff =
            (HARDNESS_ORDER[b.hardness ?? "L0"] ?? 0) -
            (HARDNESS_ORDER[a.hardness ?? "L0"] ?? 0);
          if (hardDiff !== 0) return hardDiff;
          return (b.observed_count ?? 0) - (a.observed_count ?? 0);
        });

        if (filtered.length === 0) {
          return {
            content: [
              { type: "text" as const, text: "No knots found." },
            ],
          };
        }

        const text = filtered
          .map(
            (r) =>
              `[${r.hardness}] ${r.knot_id} (observed: ${r.observed_count})\n  trigger: ${r.trigger_json}\n  effect: ${r.effect_json}\n  compensation: ${r.compensation_json ?? "none"}\n  last seen: ${r.last_observed ?? "unknown"}`
          )
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── record-metrics ───────────────────────────────────────────────────
  server.tool(
    "record-metrics",
    "Save performance metrics for a session",
    {
      session_date: z
        .string()
        .min(1)
        .describe("Session date (YYYY-MM-DD)"),
      output_count: z.number().int().min(0).describe("Number of outputs"),
      error_count: z.number().int().min(0).describe("Number of errors"),
      quality_score: z
        .number()
        .int()
        .min(1)
        .max(5)
        .describe("Quality score 1-5"),
      delegation_ratio: z
        .number()
        .min(0)
        .max(1)
        .describe("Delegation ratio 0.0-1.0"),
      knot_activations: z
        .array(z.string())
        .optional()
        .describe("Knot IDs activated in this session"),
      notes: z.string().optional().describe("Session notes"),
    },
    async (params) => {
      try {
        sqlDb.run(
          `INSERT OR REPLACE INTO session_metrics
           (session_date, output_count, error_count, quality_score, delegation_ratio, knot_activations, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            params.session_date,
            params.output_count,
            params.error_count,
            params.quality_score,
            params.delegation_ratio,
            params.knot_activations
              ? JSON.stringify(params.knot_activations)
              : null,
            params.notes ?? null,
          ]
        );

        appDb.save();

        return {
          content: [
            {
              type: "text" as const,
              text: `Metrics recorded for ${params.session_date}. Quality: ${params.quality_score}/5, Outputs: ${params.output_count}, Errors: ${params.error_count}`,
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ── get-metrics ──────────────────────────────────────────────────────
  server.tool(
    "get-metrics",
    "Retrieve session metrics for recent sessions",
    {
      last_n: z
        .number()
        .int()
        .min(1)
        .max(365)
        .optional()
        .describe("Number of recent sessions to retrieve (default 7)"),
    },
    async (params) => {
      try {
        const limit = params.last_n ?? 7;

        const rows = queryAll<MetricsRow>(
          `SELECT * FROM session_metrics ORDER BY session_date DESC LIMIT ?`,
          [limit]
        );

        if (rows.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No session metrics found.",
              },
            ],
          };
        }

        const text = rows
          .map(
            (r) =>
              `${r.session_date} | quality: ${r.quality_score}/5 | outputs: ${r.output_count} | errors: ${r.error_count} | delegation: ${r.delegation_ratio} | knots: ${r.knot_activations ?? "none"}\n  notes: ${r.notes ?? "none"}`
          )
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
