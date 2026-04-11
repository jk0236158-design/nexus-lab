import initSqlJs, { type Database } from "sql.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";
import { CREATE_TABLES_SQL } from "./schema.js";

/**
 * Resolve the database file path from environment or default.
 * Creates the parent directory if it doesn't exist.
 */
function resolveDbPath(): string {
  const envPath = process.env.MEMORY_DB_PATH;
  const dbPath = envPath
    ? resolve(envPath)
    : resolve(homedir(), ".zen", "memory.db");

  mkdirSync(dirname(dbPath), { recursive: true });
  return dbPath;
}

/**
 * Wrapper around sql.js Database that handles persistence to disk.
 */
export class AppDatabase {
  constructor(
    public readonly sqlDb: Database,
    public readonly dbPath: string | null
  ) {}

  /**
   * Persist the in-memory database to disk.
   * Call this after any write operation.
   */
  save(): void {
    if (this.dbPath) {
      const data = this.sqlDb.export();
      writeFileSync(this.dbPath, Buffer.from(data));
    }
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.sqlDb.close();
  }
}

/**
 * Initialize the SQLite database, loading from disk if it exists.
 * Creates tables if they don't exist.
 *
 * @param customPath - Override path for testing. Pass ":memory:" for in-memory only.
 */
export async function createDatabase(
  customPath?: string
): Promise<AppDatabase> {
  const SQL = await initSqlJs();

  const dbPath =
    customPath === ":memory:" ? null : (customPath ?? resolveDbPath());

  let db: Database;

  if (dbPath && existsSync(dbPath)) {
    // Load existing database from disk
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    // Create new empty database
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON;");

  // Create tables if they don't exist
  db.run(CREATE_TABLES_SQL);

  const appDb = new AppDatabase(db, dbPath);

  // Persist initial schema to disk
  appDb.save();

  return appDb;
}
