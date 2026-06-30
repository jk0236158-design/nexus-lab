#!/usr/bin/env node
// Publish a dev.to article from a local markdown draft (Green — no sale, free channel).
//
// Usage:
//   source ~/.env.nokaze            # exports DEVTO_API_KEY (same store as GUMROAD_ACCESS_TOKEN)
//   node scripts/devto_publish.mjs <draft.md>            # dry-run by default (no network, no key needed)
//   node scripts/devto_publish.mjs <draft.md> --publish  # POST to dev.to, sets published:true (live)
//   node scripts/devto_publish.mjs <draft.md> --draft    # POST to dev.to as an unpublished draft (review on dev.to first)
//   node scripts/devto_publish.mjs <draft.md> --update <id>            # dry-run preview of a PUT update to an existing article
//   node scripts/devto_publish.mjs <draft.md> --update <id> --publish  # PUT update an existing article (no duplicate)
//
// Why --update exists (2026-06-30 incident): this script was POST-only. Re-running it on an
// edited draft created a SECOND article instead of updating the first, so the same title went
// live twice (knot record id=4015385 and id=4027108). The fix has two layers:
//   1. --update <id> -> PUT https://dev.to/api/articles/<id> updates in place (the correct path).
//   2. A pre-POST duplicate guard: before a brand-new --publish, fetch our public article list
//      and abort if a published article with the exact same title already exists.
//
// Secret convention (mirrors scripts/publish-premium.py):
//   The key lives in ~/.env.nokaze as `DEVTO_API_KEY=...`. The runner sources that file,
//   so this script only ever reads process.env.DEVTO_API_KEY — it never holds or logs the value.
//
// dev.to / Forem API:
//   create: POST https://dev.to/api/articles            body { article: { body_markdown } }
//   update: PUT  https://dev.to/api/articles/<id>        body { article: { body_markdown } }
//   list:   GET  https://dev.to/api/articles?username=<u>&per_page=100   (public, no api-key)
//   headers (write): api-key, Content-Type: application/json, Accept: application/vnd.forem.api-v1+json
//   dev.to parses title / published / tags / description / canonical_url from the front matter.

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_URL = 'https://dev.to/api/articles';
const MAX_TAGS = 4;
const DEFAULT_USERNAME = 'nexuslabzen';

// Sentinel so die() can unwind the async flow cleanly. Calling process.exit(1) mid-fetch trips a
// libuv teardown assertion on Windows (src\win\async.c) while keep-alive sockets are closing, which
// clobbers the exit code. Throwing instead lets the event loop drain; the top-level catch sets
// process.exitCode = 1 after the message is already on stderr.
class AbortError extends Error {}

export function die(msg) {
  console.error(`✗ ${msg}`);
  throw new AbortError(msg);
}

export function parseArgs(argv) {
  const args = { file: null, publish: false, draft: false, update: null };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--publish') args.publish = true;
    else if (a === '--draft') args.draft = true;
    else if (a === '--update') {
      const id = rest[i + 1];
      if (!id || id.startsWith('--')) die('--update requires an article id, e.g. --update 12345');
      if (!/^\d+$/.test(id)) die(`--update id must be a number, got: ${id}`);
      args.update = id;
      i++; // consume the id token
    } else if (a.startsWith('--')) die(`unknown flag: ${a}`);
    else if (!args.file) args.file = a;
    else die(`unexpected argument: ${a}`);
  }
  if (!args.file) {
    die('missing draft path. usage: node scripts/devto_publish.mjs <draft.md> [--publish|--draft|--update <id>]');
  }
  if (args.publish && args.draft) die('--publish and --draft are mutually exclusive');
  return args;
}

// Split YAML-ish front matter (--- ... ---) from the body. We only need a few scalar fields.
export function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, hasFm: false, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { fm, hasFm: true, body: m[2] };
}

export function validate(fm, hasFm, body) {
  const problems = [];
  const warnings = [];
  if (!hasFm) problems.push('no front matter block (--- ... ---) found');
  if (!fm.title) problems.push('front matter is missing `title`');
  if (!fm.tags) warnings.push('no `tags` — dev.to allows up to 4 lowercase alphanumeric tags');
  else {
    const tags = fm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length > MAX_TAGS) problems.push(`${tags.length} tags — dev.to allows at most ${MAX_TAGS}`);
    for (const t of tags) {
      if (!/^[a-z0-9]+$/.test(t)) problems.push(`tag "${t}" must be lowercase alphanumeric (no spaces/punctuation)`);
    }
  }
  if (!fm.canonical_url) warnings.push('no `canonical_url` — set this to the original (Zenn) URL so dev.to is the syndicated copy');
  if (!fm.description) warnings.push('no `description` — dev.to uses it for the social preview');
  if (body.trim().length < 200) problems.push('body looks too short (<200 chars)');
  return { problems, warnings };
}

// Force the published flag in the front matter to match the chosen mode, leaving everything else intact.
export function forcePublished(raw, publish) {
  if (/^---/.test(raw) && /\n\s*published:\s*/.test(raw)) {
    return raw.replace(/(\n\s*published:\s*)(true|false)/i, `$1${publish ? 'true' : 'false'}`);
  }
  return raw;
}

// Pre-POST duplicate guard. Fetches our PUBLIC article list (no api-key) and reports whether a
// published article with the exact same title already exists. Pure logic + injectable fetch so it
// is testable offline. Returns { ok, duplicate, checked, reason }:
//   - checked=false means the network call failed — caller WARNS and continues (never hard-fail
//     a publish just because the dup-check could not run).
//   - duplicate is the matching article ({ id, title, url }) when title collides, else null.
export async function findPublishedDuplicate(title, username, fetchImpl = fetch) {
  if (!title) return { checked: true, duplicate: null };
  const listUrl = `${API_URL}?username=${encodeURIComponent(username)}&per_page=100`;
  let articles;
  try {
    const res = await fetchImpl(listUrl, { headers: { Accept: 'application/vnd.forem.api-v1+json' } });
    if (!res.ok) {
      return { checked: false, duplicate: null, reason: `list endpoint returned ${res.status}` };
    }
    articles = await res.json();
  } catch (e) {
    return { checked: false, duplicate: null, reason: e.message };
  }
  if (!Array.isArray(articles)) {
    return { checked: false, duplicate: null, reason: 'list response was not an array' };
  }
  const norm = (s) => String(s ?? '').trim();
  const match = articles.find((a) => norm(a.title) === norm(title));
  if (match) {
    return { checked: true, duplicate: { id: match.id, title: match.title, url: match.url } };
  }
  return { checked: true, duplicate: null };
}

async function loadKey() {
  let key = process.env.DEVTO_API_KEY;
  if (!key) {
    // Fallback: the key may be stored as a bare token in the shared secrets store
    // (~/.shared-ops/_secrets/devto_api_key.txt). This is where jun set it up on 2026-06-16;
    // the script only ever reads it here and never logs the value.
    const secretPath = join(homedir(), '.shared-ops', '_secrets', 'devto_api_key.txt');
    key = await readFile(secretPath, 'utf8').then((s) => s.trim()).catch(() => '');
  }
  if (!key) {
    die('DEVTO_API_KEY not found. Set it in env (e.g. via ~/.env.nokaze) or store the bare token at ~/.shared-ops/_secrets/devto_api_key.txt');
  }
  return key;
}

async function main() {
  const args = parseArgs(process.argv);
  const raw = await readFile(args.file, 'utf8').catch((e) => die(`cannot read ${args.file}: ${e.message}`));
  const { fm, hasFm, body } = splitFrontMatter(raw);
  const { problems, warnings } = validate(fm, hasFm, body);

  console.log(`dev.to draft check — ${args.file}`);
  console.log(`  title:         ${fm.title || '(missing)'}`);
  console.log(`  tags:          ${fm.tags || '(none)'}`);
  console.log(`  canonical_url: ${fm.canonical_url || '(none)'}`);
  console.log(`  body:          ${body.trim().length} chars`);
  console.log(`  front matter published: ${fm.published ?? '(unset)'}`);
  for (const w of warnings) console.log(`  ! ${w}`);
  if (problems.length) {
    for (const p of problems) console.error(`  ✗ ${p}`);
    die(`${problems.length} blocking problem(s) — fix before posting`);
  }
  console.log('  ✓ payload is dev.to API-ready');

  // ── Update mode: PUT an existing article in place (never creates a duplicate). ──
  if (args.update) {
    const willWrite = args.publish || args.draft;
    const putUrl = `${API_URL}/${args.update}`;
    if (!willWrite) {
      console.log(`\n[dry-run] would PUT ${putUrl} to update existing article id=${args.update}.`);
      console.log('          Re-run with --update <id> --publish (or --draft) to send the PUT.');
      console.log(`          published flag would be forced to: ${args.publish ? 'true' : args.draft ? 'false' : '(front matter value)'}`);
      return;
    }
    const key = await loadKey();
    const bodyMarkdown = forcePublished(raw, args.publish);
    console.log(`\nPUT ${putUrl}  (published=${args.publish})`);
    const res = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'api-key': key,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.forem.api-v1+json',
      },
      body: JSON.stringify({ article: { body_markdown: bodyMarkdown } }),
    });
    const text = await res.text();
    if (!res.ok) die(`dev.to API ${res.status}: ${text.slice(0, 500)}`);
    let out;
    try { out = JSON.parse(text); } catch { out = {}; }
    console.log(`✓ updated article id=${out.id ?? args.update}`);
    console.log(`  url: ${out.url || out.canonical_url || '(see dev.to dashboard)'}`);
    return;
  }

  // ── Create mode (POST). ──
  const isLive = args.publish || args.draft;
  if (!isLive) {
    console.log('\n[dry-run] no network call. Re-run with --publish (live), --draft (unpublished on dev.to), or --update <id> (edit an existing post) once DEVTO_API_KEY is sourced.');
    return;
  }

  // Duplicate guard — only meaningful for a live --publish (creating a public post). A --draft is
  // unpublished, so it cannot collide with a live article; skip the check there.
  if (args.publish) {
    const username = process.env.DEVTO_USERNAME || DEFAULT_USERNAME;
    console.log(`\ndup-check: scanning published articles for @${username} …`);
    const { checked, duplicate, reason } = await findPublishedDuplicate(fm.title, username);
    if (!checked) {
      console.log(`  ! dup-check could not run (${reason || 'network/list error'}) — continuing WITHOUT the guard.`);
    } else if (duplicate) {
      die(
        `a published article with the same title already exists (id=${duplicate.id}, ${duplicate.url || 'no url'}). ` +
          `Do NOT create a duplicate — update it instead: node scripts/devto_publish.mjs ${args.file} --update ${duplicate.id} --publish`,
      );
    } else {
      console.log('  ✓ no published article with this exact title — safe to create.');
    }
  }

  const key = await loadKey();
  const bodyMarkdown = forcePublished(raw, args.publish);

  console.log(`\nPOST ${API_URL}  (published=${args.publish})`);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'api-key': key,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.forem.api-v1+json',
    },
    body: JSON.stringify({ article: { body_markdown: bodyMarkdown } }),
  });

  const text = await res.text();
  if (!res.ok) die(`dev.to API ${res.status}: ${text.slice(0, 500)}`);
  let out;
  try { out = JSON.parse(text); } catch { out = {}; }
  console.log(`✓ ${args.publish ? 'published' : 'created draft'} — id=${out.id ?? '?'}`);
  console.log(`  url: ${out.url || out.canonical_url || '(see dev.to dashboard)'}`);
}

// Only run when invoked directly (so the pure functions above can be imported by tests).
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirectly) {
  try {
    await main();
  } catch (e) {
    // die() already printed the message; AbortError just unwinds. Any other error: surface it.
    if (!(e instanceof AbortError)) console.error(`✗ ${e.stack || e.message}`);
    process.exitCode = 1;
  }
}
