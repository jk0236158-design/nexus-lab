# Changelog

All notable changes to the `database` premium template are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this template adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-17

### Added
- Initial release of the `database` premium MCP server template
- SQLite storage with Drizzle ORM for type-safe queries
- WAL (Write-Ahead Logging) mode enabled by default for concurrent access
- Foreign keys enforced by default (`PRAGMA foreign_keys = ON`)
- CRUD MCP tools for a sample `notes` table
- MCP resources for listing and reading stored records
- Zod-based input validation on all tool parameters
- Vitest test suite with in-memory SQLite database for fast, isolated tests
- `.env.example` for `DATABASE_URL` configuration
- Drizzle migration config (`drizzle.config.ts`)

### Security
- All queries use Drizzle ORM parameterized queries (SQL injection safe)
- Input validation via Zod schemas (length limits, required fields)
- Error messages sanitized to avoid leaking internal database state
