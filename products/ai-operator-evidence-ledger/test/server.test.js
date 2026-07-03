// server.test.js
// Boots the real HTTP server on an ephemeral port and exercises the routes,
// including a recheck that flips the stale case over the wire.

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLedger, createServer } from "../src/server.js";
import { STATUS } from "../src/schema.js";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function req(port, method, path, body) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

test("server: dashboard, cases, and recheck flip over HTTP", async (t) => {
  const ledger = buildLedger();
  const server = createServer(ledger);
  const port = await listen(server);
  t.after(() => server.close());

  // Health: /healthz (container-internal) and /health (run.app-safe alias —
  // Google's frontend swallows /healthz on public run.app URLs).
  const health = await req(port, "GET", "/healthz");
  assert.equal(health.status, 200);
  assert.equal(health.json.status, "ok");
  const healthAlias = await req(port, "GET", "/health");
  assert.equal(healthAlias.status, 200);
  assert.equal(healthAlias.json.status, "ok");

  // Dashboard renders HTML with all three case ids.
  const dash = await req(port, "GET", "/");
  assert.equal(dash.status, 200);
  for (const id of ["claim-happy-readme-tests", "claim-missing-artifact", "claim-stale-next-action"]) {
    assert.ok(dash.text.includes(id), `dashboard missing ${id}`);
  }

  // Initial verdicts.
  const cases = await req(port, "GET", "/api/cases");
  const byId = Object.fromEntries(cases.json.cases.map((c) => [c.claim_id, c.status]));
  assert.equal(byId["claim-happy-readme-tests"], STATUS.EVIDENCE_BACKED);
  assert.equal(byId["claim-missing-artifact"], STATUS.REJECTED_MISSING_PROOF);
  assert.equal(byId["claim-stale-next-action"], STATUS.EVIDENCE_BACKED);

  // Recheck advancing 7h flips the stale case (6h window) but not the happy one (24h).
  const recheck = await req(port, "POST", "/api/recheck", { advance_hours: 7 });
  assert.equal(recheck.status, 200);
  const rid = Object.fromEntries(recheck.json.results.map((r) => [r.claim_id, r.verdict]));
  assert.equal(rid["claim-happy-readme-tests"], STATUS.EVIDENCE_BACKED);
  assert.equal(rid["claim-stale-next-action"], STATUS.STALE_AFTER_RECHECK);

  // New claim intake over HTTP.
  const created = await req(port, "POST", "/api/claims", {
    claim_id: "claim-runtime-1",
    agent_name: "AdhocAgent",
    claimed_outcome: "done, trust me",
    evidence_requirements: ["artifact_exists"],
  });
  assert.equal(created.status, 201);
  assert.equal(created.json.status, STATUS.REJECTED_MISSING_PROOF);

  // Cases carry an enrichment field; with no key it is the local fallback.
  const enrichedCases = await req(port, "GET", "/api/cases");
  for (const c of enrichedCases.json.cases) {
    assert.ok(c.enrichment, `case ${c.claim_id} should have enrichment`);
    assert.ok(["local-fallback", "gemini"].includes(c.enrichment.source));
  }

  // /api/enrich re-runs the enrichment pass; no key -> local fallback source.
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const enrich = await req(port, "POST", "/api/enrich");
    assert.equal(enrich.status, 200);
    assert.equal(enrich.json.source, "local-fallback");
    assert.ok(enrich.json.results.length >= 3);
  } finally {
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }

  // Dashboard surfaces the AI enrichment block.
  const dash2 = await req(port, "GET", "/");
  assert.ok(dash2.text.includes("AI enrichment"), "dashboard should show enrichment block");
});
