# Changelog

All notable changes to the `auth` premium template are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this template adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-17

### Added
- Initial release of the `auth` premium MCP server template
- JWT-based authentication with configurable secret and expiry
- API key authentication as a simpler alternative
- Express HTTP transport with CORS support
- Role-based access control (admin / user roles)
- `whoami` tool for inspecting the authenticated user context
- `generate-token` tool for admin-only JWT issuance
- Rate limiting middleware to prevent abuse
- Zod-based input validation on all tool parameters
- Vitest test suite covering auth flows and tool behavior
- `.env.example` for `JWT_SECRET` and `API_KEYS` configuration

### Security
- Passwords and secrets never appear in MCP responses
- Error messages sanitized via `formatAuthError()` to avoid leaking internal state
- Rate limiting enabled by default on all endpoints
- Input validation via Zod schemas with explicit descriptions
