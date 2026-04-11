import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL ?? "./data.db";

const sqlite = new Database(DATABASE_URL);

// Enable WAL mode for better concurrent read performance
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db: BetterSQLite3Database<typeof schema> = drizzle(sqlite, {
  schema,
});

/**
 * Initialize the database by creating tables if they don't exist.
 * Called once at server startup.
 */
export function setupDatabase(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

/**
 * Create a database instance from a custom SQLite connection.
 * Useful for testing with in-memory databases.
 */
export function createDatabase(
  connection: Database.Database,
): BetterSQLite3Database<typeof schema> {
  connection.pragma("foreign_keys = ON");
  connection.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return drizzle(connection, { schema });
}
