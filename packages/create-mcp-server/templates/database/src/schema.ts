import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Notes table — stores user notes with title, content, and timestamps.
 *
 * Timestamps are stored as ISO 8601 strings (SQLite has no native date type).
 * Defaults are handled at the database level via SQL expressions.
 */
export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

/** TypeScript type for a note row returned from the database. */
export type Note = typeof notes.$inferSelect;

/** TypeScript type for inserting a new note. */
export type NewNote = typeof notes.$inferInsert;
