#!/usr/bin/env node
// Publish a dev.to article from a local markdown draft (Green — no sale, free channel).
//
// Usage:
//   source ~/.env.nokaze            # exports DEVTO_API_KEY (same store as GUMROAD_ACCESS_TOKEN)
//   node scripts/devto_publish.mjs <draft.md>            # dry-run by default (no network, no key needed)
//   node scripts/devto_publish.mjs <draft.md> --publish  # POST to dev.to, sets published:true (live)
//   node scripts/devto_publish.mjs <draft.md> --draft    # POST to dev.to as an unpublished draft (review on dev.to first)
//
// Secret convention (mirrors scripts/publish-premium.py):
//   The key lives in ~/.env.nokaze as `DEVTO_API_KEY=...`. The runner sources that file,
//   so this script only ever reads process.env.DEVTO_API_KEY — it never holds or logs the value.
//
// dev.to / Forem API: POST https://dev.to/api/articles
//   headers: api-key, Content-Type: application/json, Accept: application/vnd.forem.api-v1+json
//   body:    { article: { body_markdown: <full markdown incl. front matter> } }
//   dev.to parses title / published / tags / description / canonical_url from the front matter.

import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API_URL = 'https://dev.to/api/articles';
const MAX_TAGS = 4;

function die(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { file: null, publish: false, draft: false };
  for (const a of argv.slice(2)) {
    if (a === '--publish') args.publish = true;
    else if (a === '--draft') args.draft = true;
    else if (a.startsWith('--')) die(`unknown flag: ${a}`);
    else if (!args.file) args.file = a;
    else die(`unexpected argument: ${a}`);
  }
  if (!args.file) die('missing draft path. usage: node scripts/devto_publish.mjs <draft.md> [--publish|--draft]');
  if (args.publish && args.draft) die('--publish and --draft are mutually exclusive');
  return args;
}

// Split YAML-ish front matter (--- ... ---) from the body. We only need a few scalar fields.
function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { fm: {}, hasFm: false, body: raw };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return { fm, hasFm: true, body: m[2] };
}

function validate(fm, hasFm, body) {
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

const isLive = args.publish || args.draft;
if (!isLive) {
  console.log('\n[dry-run] no network call. Re-run with --publish (live) or --draft (unpublished on dev.to) once DEVTO_API_KEY is sourced.');
  process.exit(0);
}

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

// Force the published flag in the front matter to match the chosen mode, leaving everything else intact.
let bodyMarkdown = raw;
if (/^---/.test(raw) && /\n\s*published:\s*/.test(raw)) {
  bodyMarkdown = raw.replace(/(\n\s*published:\s*)(true|false)/i, `$1${args.publish ? 'true' : 'false'}`);
}

console.log(`\nPOST ${API_URL}  (published=${args.publish})`);
const res = await fetch(API_URL, {
  method: 'POST',
  headers: {
    'api-key': key,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.forem.api-v1+json',
  },
  body: JSON.stringify({ article: { body_markdown: bodyMarkdown } }),
});

const text = await res.text();
if (!res.ok) {
  die(`dev.to API ${res.status}: ${text.slice(0, 500)}`);
}
let out;
try { out = JSON.parse(text); } catch { out = {}; }
console.log(`✓ ${args.publish ? 'published' : 'created draft'} — id=${out.id ?? '?'}`);
console.log(`  url: ${out.url || out.canonical_url || '(see dev.to dashboard)'}`);
