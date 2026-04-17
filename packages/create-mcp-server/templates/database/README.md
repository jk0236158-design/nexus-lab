# MCP Server — Database Template

A production-ready [Model Context Protocol](https://modelcontextprotocol.io/) server with built-in SQLite database connectivity, powered by [Drizzle ORM](https://orm.drizzle.team/).

## Who this is for

- **You're building:** a Claude Code / Claude Desktop MCP server that needs to persist structured data, for your team or a small production use case.
- **What it saves you:** the half-day of wiring Drizzle + SQLite + Zod + Vitest yourself, plus the mistakes you'd make on input caps, WAL mode, foreign keys, and isolated test setups. Parameterized queries are the default — you can't accidentally ship SQL built from string concatenation.
- **What's in the zip:** full scaffolded project — `src/` (index, db, schema, tools, resources), `tests/tools.test.ts` with an in-memory DB helper, `drizzle.config.ts`, `vitest.config.ts`, `.env.example`, `.gitignore`, TS config, and this README.
- **Not a fit if:** you need Postgres / MySQL from day one (SQLite only here), multi-writer / distributed workloads, or a visual admin UI beyond `drizzle-studio`.
- **Run it in 4 steps:** `npm install` → `cp .env.example .env` → `npm run build` → `npm start`. The `notes` table is auto-created on first launch.
- **Next:** [get it on Gumroad](https://nexuslabzen.gumroad.com/l/ijuvn) · scaffold via `npx @nexus-lab/create-mcp-server my-server --template database` · [source on GitHub](https://github.com/nexus-lab-zen/nexus-lab).

## Features

- Type-safe CRUD with Drizzle ORM (full TypeScript inference on rows and inserts)
- SQLite + WAL mode for concurrent read performance
- SQL injection-safe — all queries go through Drizzle's parameterized query builder
- In-memory test database helper for fast, isolated Vitest suites
- Zod input validation with defensive defaults (length caps, positive IDs)
- Foreign keys enabled by default (`foreign_keys = ON`)
- MCP tools (`create-note`, `list-notes`, `get-note`, `update-note`, `delete-note`) and resources (list + schema) out of the box

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Build the project
npm run build

# Start the server
npm start
```

The server auto-creates the `notes` table on first launch, so you can skip the migration commands for the initial setup.

## Quick Start Example

Once the server is connected to Claude Desktop (or any MCP client like `@modelcontextprotocol/inspector`), try this prompt:

> Create a note titled "Test" with content "Hello from MCP".

The client will invoke the `create-note` tool:

```json
{
  "tool": "create-note",
  "arguments": {
    "title": "Test",
    "content": "Hello from MCP"
  }
}
```

And receive a response like:

```json
{
  "id": 1,
  "title": "Test",
  "content": "Hello from MCP",
  "createdAt": "2026-04-17 03:14:22",
  "updatedAt": "2026-04-17 03:14:22"
}
```

Follow up with:

> List all notes.

The `list-notes` tool returns an array of every stored row. `get-note`, `update-note`, and `delete-note` work the same way, keyed by the numeric `id` returned above.

## Available Tools

| Tool            | Description                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `create-note`   | Create a new note. `title` required (1–500 chars), `content` required (1–50,000 chars)               |
| `list-notes`    | List all notes, with optional search query filtering                                                 |
| `get-note`      | Retrieve a single note by its ID                                                                     |
| `update-note`   | Update a note by ID. `title` optional (1–500 chars), `content` optional (1–50,000 chars)             |
| `delete-note`   | Delete a note by its ID                                                                              |

## Available Resources

| URI            | Description                          |
| -------------- | ------------------------------------ |
| `notes://list` | All notes in the database as JSON    |
| `db://schema`  | Database schema documentation        |

## Configuration

### Environment Variables

| Variable       | Default      | Description                 |
| -------------- | ------------ | --------------------------- |
| `DATABASE_URL` | `./data.db`  | Path to the SQLite database |

### Claude Desktop Integration

Add this to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

## Database Management

```bash
# Generate migration files from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
```

## Development

```bash
# Watch mode — recompiles on file changes
npm run dev

# Run tests
npm test
```

## Extending the Schema

1. Edit `src/schema.ts` to add new tables or columns.
2. Run `npm run db:generate` to create a migration under `drizzle/`.
3. Run `npm run db:migrate` to apply it.
4. Add corresponding tools in `src/tools.ts` and resources in `src/resources.ts`.

### Adding a column to existing data

When the `notes` table already has rows, a non-nullable column without a default will fail to apply. Pick one of:

- Add the column as `NOT NULL` with a `.default(...)` so existing rows get a value.
- Add the column as nullable (`text("tag")` without `.notNull()`), backfill in a follow-up migration, then tighten to `NOT NULL` if needed.

### Rolling back a bad migration

Drizzle Kit does not auto-generate `down` migrations. To roll back:

1. **Stop the server** so no writes come in during recovery.
2. Restore the SQLite file from your backup (`cp data.db.bak data.db`), or
3. Write an inverse migration by hand (e.g. `ALTER TABLE notes DROP COLUMN tag;`) and apply it via `sqlite3 data.db < rollback.sql`.
4. Delete the failed migration file from `drizzle/` and re-run `npm run db:generate` from a clean schema.

Always snapshot `data.db` (or run against a copy) before applying a migration in production.

## Security Notes

This template is designed to be safe by default, but a few rules matter when you ship it:

- **SQL injection is blocked by construction.** All queries flow through Drizzle's parameterized query builder — there is no string concatenation on user input anywhere in `src/tools.ts`.
- **Zod validates every tool input.** Titles are capped at 500 chars, content at 50,000 chars, IDs must be positive integers. Tighten these bounds if your use case is narrower.
- **Never commit `.env`.** `.gitignore` already excludes it, but double-check before your first push — `DATABASE_URL` can leak deployment paths.
- **In production, use an absolute `DATABASE_URL`** and restrict filesystem permissions on the `.db` file (e.g. `chmod 600 data.db`). The default `./data.db` is relative to the process's cwd and is fine for local dev only.
- **Foreign keys are enforced** (`foreign_keys = ON`) — relational constraints you declare in `schema.ts` will actually fire at runtime.

## Troubleshooting

### `SqliteError: database is locked`

SQLite serializes writes. WAL mode (enabled by default in `src/db.ts`) lets reads and writes run concurrently, but two processes writing at once can still collide. Check that you don't have a second server instance, a `db:studio` session, or a long-running test run holding the file.

### `no such table: notes`

The server calls `setupDatabase()` at startup to create tables, so this usually means you're running a query before startup completes, or you pointed `DATABASE_URL` at a fresh file without launching the server once. Start the server (`npm start`) once to initialize, or run `npm run db:migrate` if you prefer migrations.

### `foreign key mismatch` or `FOREIGN KEY constraint failed`

Foreign keys are on by default. Confirm the referenced row exists before inserting, and that the column types match exactly (SQLite does not coerce `TEXT` to `INTEGER` for FK checks). If you disabled `foreign_keys = ON` somewhere, re-enable it in `src/db.ts`.

### `better-sqlite3` fails to install (native build error)

`better-sqlite3` compiles a native binding. You need:

- **Node.js 20+** (prebuilt binaries are published for current LTS versions).
- **Python 3** and a C++ toolchain for fallback builds (`build-essential` on Linux, Xcode CLT on macOS, `windows-build-tools` or Visual Studio Build Tools on Windows).

Try `npm rebuild better-sqlite3` after installing the toolchain. If you're on an unusual Node version, downgrade to the latest LTS.

### `DATABASE_URL` is ignored

`src/index.ts` loads `dotenv/config` before anything else, so `.env` should be picked up automatically. Check that:

- `.env` lives at the project root (same directory as `package.json`).
- You ran `cp .env.example .env` and edited the copy, not the template.
- No shell-level `DATABASE_URL` is overriding the file.

## Project Structure

```
├── src/
│   ├── index.ts        # Entry point — server setup and transport
│   ├── db.ts           # Database connection and initialization
│   ├── schema.ts       # Drizzle ORM table definitions
│   ├── tools.ts        # MCP tool handlers (CRUD)
│   └── resources.ts    # MCP resource handlers
├── tests/
│   └── tools.test.ts   # CRUD operation tests
├── drizzle.config.ts   # Drizzle Kit configuration
├── vitest.config.ts    # Test runner configuration
├── tsconfig.json       # TypeScript configuration
└── package.json
```

## License

MIT
