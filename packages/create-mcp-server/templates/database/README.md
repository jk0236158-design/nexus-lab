# MCP Server — Database Template

A production-ready [Model Context Protocol](https://modelcontextprotocol.io/) server with built-in SQLite database connectivity, powered by [Drizzle ORM](https://orm.drizzle.team/).

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

## Available Tools

| Tool            | Description                                          |
| --------------- | ---------------------------------------------------- |
| `create-note`   | Create a new note with a title and optional content  |
| `list-notes`    | List all notes, with optional search query filtering |
| `get-note`      | Retrieve a single note by its ID                     |
| `update-note`   | Update a note's title and/or content by ID           |
| `delete-note`   | Delete a note by its ID                              |

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
2. Run `npm run db:generate` to create a migration.
3. Run `npm run db:migrate` to apply it.
4. Add corresponding tools in `src/tools.ts` and resources in `src/resources.ts`.

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
