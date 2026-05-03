# Changelog

## v0.1.0 — 2026-04-22

Initial release.

### Features

- **`defineConfig` / `secret`** — Zod-based schema definition with first-class `@secret` marker for log redaction.
- **`loadConfig`** — single-call loader for env + file + profile, with deep-merge semantics and fail-fast Zod validation.
- **`bindEnvToObject`** — prefix-driven env-to-nested-object binding (`MCP_SERVER_PORT` → `server.port`), with `__` as the explicit-depth escape hatch.
- **`resolveProfile`** — `dev` / `prod` / `test` resolution from `MCP_CONFIG_PROFILE` (preferred) and `NODE_ENV` (fallback).
- **`detectSecretPaths` / `redactSecrets` / `safeStringify`** — schema-walking redaction so `console.log(safeStringify(config, schema))` is leak-proof.
- **`ConfigValidationError`** — multi-issue aggregator with stable `code: "CONFIG_INVALID"`.
- **MCP server entry** with 3 demo tools (`config-profile`, `config-dump`, `config-has`).
- **YAML / TOML / JSON** file support out of the box.
- **51 Vitest tests** across 5 test files; 90% coverage threshold enforced.

### Built on

- `@nexus-lab/mcp-toolkit ^0.1.0` (`runStdio`, `jsonResponse`, `textResponse`).
- `zod ^3.24`, `yaml ^2.6`, `smol-toml ^1.3`, `dotenv ^16.4`.
