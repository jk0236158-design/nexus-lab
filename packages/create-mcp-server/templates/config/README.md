# MCP server template — `config`

Typed, profile-aware, schema-validated config for MCP servers — env / file / profile in one shot, with secret redaction baked into the log path.

Built on `@nexus-lab/mcp-toolkit`. Free template, MIT-licensed.

---

## 1. Who this is for

Individual developers building MCP servers who keep ending up with:

- a `process.env.X` strewn across 8 files with no single declaration of "what config does this server expect"
- a YAML / JSON config file that breaks silently when a key is renamed
- separate `dev` / `prod` / `test` startup scripts that drift over time
- secrets accidentally echoed by `console.log(config)`

If any of those sting, this template gives you a battle-tested 350-LOC starting point you can ship today.

## 2. What this prevents (3 落とし穴)

1. **Untyped env vars.** `process.env.PORT` is `string | undefined`; this template binds env into a Zod-validated shape, so a missing or malformed key fails at startup with a multi-issue error message — not at request time.
2. **Schema-less file loading.** YAML / TOML / JSON parsers happily return `any`. This template runs every loaded file through Zod, so renaming a key in your code and forgetting the file (or vice versa) is caught before the server boots.
3. **Ad-hoc profile switching.** No more `if (process.env.NODE_ENV === "production") {...}` sprinkled across init code. `dev` / `prod` / `test` are first-class, with both `NODE_ENV` and `MCP_CONFIG_PROFILE` selectors.

## 3. What's in the zip

```
src/
  config/
    schema.ts         # defineConfig + secret() helper
    loader.ts         # env + file + profile pipeline
    env-binding.ts    # MCP_FOO_BAR -> { foo: { bar: ... } }
    profile.ts        # NODE_ENV + MCP_CONFIG_PROFILE resolution
    secrets.ts        # @secret-driven log redaction
    validate.ts       # ConfigValidationError aggregator
    index.ts          # public surface
  index.ts            # MCP server entry, wired to toolkit
.env.example
config.example.yaml
config.example.toml
config.example.json
tests/
  schema.test.ts
  secrets.test.ts
  profile.test.ts
  env-binding.test.ts
  loader.test.ts
  fixtures/           # 7 fixture files driving the test pipeline
README.md             # this file
DESIGN_BRIEF.md       # 1-page rationale (why these defaults)
CHANGELOG.md
LICENSE               # MIT
package.json
tsconfig.json
vitest.config.ts
```

## 4. Constraints (intentional scope cuts)

- **Static config only.** No hot reload — restart the process to pick up new values. Hot reload is a portability minefield (file watchers, race conditions, partial-update semantics) and almost never worth the complexity for an MCP server.
- **Single-source.** No remote config (Consul / etcd / AWS Parameter Store). Add a thin loader on top of `loadConfig` if you need it; the public surface is small enough to wrap.
- **No nested arrays from env.** `MCP_SERVERS_0_PORT=...` is not supported — express that with a YAML / JSON file.
- **Snake_case keys for env round-trip.** Each single `_` in an env-var name introduces a nesting level; segments are lowercased. So `MCP_FEATURES_VERBOSE_LOGGING` binds to `features.verbose.logging` (3 levels). To get a leaf with an underscore in its name (like `verbose_logging`), use `__` (double underscore): `MCP_FEATURES_VERBOSE__LOGGING` → `features.verbose_logging`. Schemas should declare keys in lowercase + snake_case.

## 5. Shortest path

```bash
cp config.example.yaml config.yaml      # 1
cp .env.example .env                    # 2
npm install                             # 3
npm test                                # 4
npm run dev                             # 5
```

Step 4 should print `5 test files passed (51 tests)`. Step 5 launches the MCP server over stdio with the loaded config.

## 6. What to do next

1. **Edit `ConfigSchema` in `src/index.ts`** — add the fields your server actually needs. Mark anything sensitive with `secret(z.string(), "human label")`.
2. **Write a `config.<profile>.yaml`** for each tier you deploy to (dev / prod / test). The loader picks one automatically based on `NODE_ENV` or `MCP_CONFIG_PROFILE`.
3. **Replace the 3 demo tools** (`config-profile`, `config-dump`, `config-has`) with your real ones — they're there so you can sanity-check the loader without writing tools first.
4. **Add `MCP_*` env vars** in your deployment environment for any value that should override file-tier settings (env wins on conflict).

For deeper rationale, see `DESIGN_BRIEF.md`.

---

Built by Nexus Lab. Source: <https://github.com/nexus-lab-zen/nexus-lab>.
