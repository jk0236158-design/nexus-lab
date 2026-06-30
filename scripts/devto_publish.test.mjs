// Tests for scripts/devto_publish.mjs — arg-parse, front-matter, update-mode arg shape,
// and the offline duplicate guard (findPublishedDuplicate with an injected fetch).
//
//   node --test scripts/devto_publish.test.mjs
//
// No network and no api-key: findPublishedDuplicate takes an injectable fetch so we exercise the
// title-collision logic and the network-failure-soft-fail branch deterministically.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArgs,
  splitFrontMatter,
  validate,
  forcePublished,
  findPublishedDuplicate,
} from './devto_publish.mjs';

const argv = (...rest) => ['node', 'devto_publish.mjs', ...rest];

test('parseArgs: bare file = dry-run create', () => {
  const a = parseArgs(argv('post.md'));
  assert.equal(a.file, 'post.md');
  assert.equal(a.publish, false);
  assert.equal(a.draft, false);
  assert.equal(a.update, null);
});

test('parseArgs: --publish flag', () => {
  const a = parseArgs(argv('post.md', '--publish'));
  assert.equal(a.publish, true);
});

test('parseArgs: --update <id> captures the id and order does not matter', () => {
  const a = parseArgs(argv('post.md', '--update', '12345'));
  assert.equal(a.update, '12345');
  assert.equal(a.publish, false);

  const b = parseArgs(argv('--update', '999', 'post.md', '--publish'));
  assert.equal(b.update, '999');
  assert.equal(b.file, 'post.md');
  assert.equal(b.publish, true);
});

test('parseArgs: --update with a non-numeric id aborts (die throws)', () => {
  assert.throws(() => parseArgs(argv('post.md', '--update', 'abc')), /must be a number/);
});

test('parseArgs: --update with a missing id aborts (die throws)', () => {
  assert.throws(() => parseArgs(argv('post.md', '--update')), /requires an article id/);
});

test('splitFrontMatter: parses scalar fields and body', () => {
  const raw = '---\ntitle: Hello World\npublished: true\ntags: ai, llm\n---\n\nbody text here';
  const { fm, hasFm, body } = splitFrontMatter(raw);
  assert.equal(hasFm, true);
  assert.equal(fm.title, 'Hello World');
  assert.equal(fm.published, 'true');
  assert.equal(fm.tags, 'ai, llm');
  assert.equal(body.trim(), 'body text here');
});

test('validate: missing title is a blocking problem', () => {
  const { problems } = validate({}, true, 'x'.repeat(300));
  assert.ok(problems.some((p) => /title/.test(p)));
});

test('validate: too many tags is blocking', () => {
  const { problems } = validate({ title: 't', tags: 'a, b, c, d, e' }, true, 'x'.repeat(300));
  assert.ok(problems.some((p) => /at most 4/.test(p)));
});

test('forcePublished: flips published flag in front matter, body untouched', () => {
  const raw = '---\ntitle: t\npublished: false\n---\nbody';
  assert.match(forcePublished(raw, true), /published:\s*true/);
  assert.match(forcePublished(raw, false), /published:\s*false/);
  // No front matter published key -> returned unchanged
  const noPub = '---\ntitle: t\n---\nbody';
  assert.equal(forcePublished(noPub, true), noPub);
});

test('findPublishedDuplicate: exact title match returns the duplicate', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => [
      { id: 111, title: 'Other post', url: 'https://dev.to/x/other' },
      { id: 222, title: 'My Title', url: 'https://dev.to/x/my-title' },
    ],
  });
  const r = await findPublishedDuplicate('My Title', 'nexuslabzen', fakeFetch);
  assert.equal(r.checked, true);
  assert.deepEqual(r.duplicate, { id: 222, title: 'My Title', url: 'https://dev.to/x/my-title' });
});

test('findPublishedDuplicate: no match returns duplicate=null', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => [{ id: 111, title: 'Other post', url: 'u' }],
  });
  const r = await findPublishedDuplicate('Brand New Title', 'nexuslabzen', fakeFetch);
  assert.equal(r.checked, true);
  assert.equal(r.duplicate, null);
});

test('findPublishedDuplicate: whitespace-insensitive match', async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => [{ id: 5, title: 'Spaced  ', url: 'u' }] });
  const r = await findPublishedDuplicate('  Spaced', 'nexuslabzen', fakeFetch);
  assert.equal(r.duplicate?.id, 5);
});

test('findPublishedDuplicate: network throw -> checked=false (soft-fail, no throw)', async () => {
  const fakeFetch = async () => { throw new Error('ENOTFOUND dev.to'); };
  const r = await findPublishedDuplicate('Any', 'nexuslabzen', fakeFetch);
  assert.equal(r.checked, false);
  assert.equal(r.duplicate, null);
  assert.match(r.reason, /ENOTFOUND/);
});

test('findPublishedDuplicate: non-200 -> checked=false (soft-fail)', async () => {
  const fakeFetch = async () => ({ ok: false, status: 503, json: async () => [] });
  const r = await findPublishedDuplicate('Any', 'nexuslabzen', fakeFetch);
  assert.equal(r.checked, false);
  assert.match(r.reason, /503/);
});

test('findPublishedDuplicate: non-array body -> checked=false (soft-fail)', async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => ({ error: 'nope' }) });
  const r = await findPublishedDuplicate('Any', 'nexuslabzen', fakeFetch);
  assert.equal(r.checked, false);
});
