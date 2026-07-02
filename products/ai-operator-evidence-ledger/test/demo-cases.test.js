// demo-cases.test.js
// End-to-end tests over the three synthetic demo cases, including the timed
// recheck that flips the stale case from green to stale.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Ledger } from "../src/ledger.js";
import { writeArtifacts, sampleClaims } from "../src/seed.js";
import { normalizeClaim, STATUS } from "../src/schema.js";

function freshLedger() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-demo-"));
  writeArtifacts(root);
  const ledger = new Ledger({ artifactsRoot: root });
  for (const claim of sampleClaims()) ledger.intake(claim);
  return ledger;
}

test("happy case becomes evidence_backed", () => {
  const ledger = freshLedger();
  const v = ledger.check("claim-happy-readme-tests");
  assert.equal(v.verdict, STATUS.EVIDENCE_BACKED, JSON.stringify(v.checks, null, 2));
  assert.ok(v.checks.every((c) => c.passed));
});

test("missing-artifact case is rejected_missing_proof and gets a repair action", () => {
  const ledger = freshLedger();
  ledger.check("claim-missing-artifact");
  const c = ledger.get("claim-missing-artifact");
  assert.equal(c.status, STATUS.REJECTED_MISSING_PROOF);
  assert.ok(c.repair_action && c.repair_action.length > 0);
  // The failing checks include the missing artifact.
  const failed = c.last_verdict.checks.filter((x) => !x.passed).map((x) => x.check);
  assert.ok(failed.includes("artifact_exists"));
});

test("stale case: green on first check, stale after the review window elapses", () => {
  const ledger = freshLedger();

  // First check at submission time -> evidence_backed.
  const first = ledger.check("claim-stale-next-action");
  assert.equal(first.verdict, STATUS.EVIDENCE_BACKED, JSON.stringify(first.checks, null, 2));

  // Timed recheck: advance the clock past the 6h window for this case.
  const c = ledger.get("claim-stale-next-action");
  const beyond = new Date(new Date(c.submitted_at).getTime() + 7 * 3600 * 1000);
  const second = ledger.check("claim-stale-next-action", { now: beyond });
  assert.equal(second.verdict, STATUS.STALE_AFTER_RECHECK);

  // History records the flip.
  assert.equal(c.history.length, 2);
  assert.equal(c.history[0].verdict, STATUS.EVIDENCE_BACKED);
  assert.equal(c.history[1].verdict, STATUS.STALE_AFTER_RECHECK);
});

test("recheckAll at submission time keeps happy+stale green and missing rejected", () => {
  const ledger = freshLedger();
  const results = ledger.recheckAll();
  const byId = Object.fromEntries(results.map((r) => [r.claim_id, r.verdict]));
  assert.equal(byId["claim-happy-readme-tests"], STATUS.EVIDENCE_BACKED);
  assert.equal(byId["claim-missing-artifact"], STATUS.REJECTED_MISSING_PROOF);
  assert.equal(byId["claim-stale-next-action"], STATUS.EVIDENCE_BACKED);
});

test("recheckAll after window flips only the stale case", () => {
  const ledger = freshLedger();
  ledger.recheckAll(); // initial green pass
  const future = new Date(Date.now() + 7 * 3600 * 1000);
  const results = ledger.recheckAll({ now: future });
  const byId = Object.fromEntries(results.map((r) => [r.claim_id, r.verdict]));
  // Happy case has a 24h window, so 7h does not make it stale.
  assert.equal(byId["claim-happy-readme-tests"], STATUS.EVIDENCE_BACKED);
  assert.equal(byId["claim-missing-artifact"], STATUS.REJECTED_MISSING_PROOF);
  // Stale case has a 6h window, so 7h flips it.
  assert.equal(byId["claim-stale-next-action"], STATUS.STALE_AFTER_RECHECK);
});

test("check() attaches a local enrichment to each case (key-optional, no network)", () => {
  const ledger = freshLedger();
  ledger.check("claim-missing-artifact");
  const c = ledger.get("claim-missing-artifact");
  assert.ok(c.enrichment, "enrichment should be attached");
  assert.equal(c.enrichment.source, "local-fallback");
  assert.equal(c.enrichment.classification, "build_artifact");
  assert.match(c.enrichment.failure_summary, /missing required evidence/i);
  // summary() surfaces the enrichment
  const s = ledger.summary().find((x) => x.claim_id === "claim-missing-artifact");
  assert.ok(s.enrichment);
});

test("enrichAll() resolves to local fallback when no key is set", async () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const ledger = freshLedger();
    ledger.recheckAll();
    const results = await ledger.enrichAll();
    assert.equal(results.length, 3);
    for (const r of results) assert.equal(r.enrichment.source, "local-fallback");
  } finally {
    if (prev !== undefined) process.env.GEMINI_API_KEY = prev;
  }
});

test("intake normalization drops unknown checks and defaults risk/window", () => {
  const { case: c, intake_notes } = normalizeClaim({
    claim_id: "x",
    agent_name: "A",
    claimed_outcome: "done",
    evidence_requirements: ["artifact_exists", "totally_made_up_check"],
    risk_level: "ultra",
    review_window_hours: -5,
  });
  assert.deepEqual(c.evidence_requirements, ["artifact_exists"]);
  assert.equal(c.risk_level, "medium");
  assert.equal(c.review_window_hours, 24);
  assert.ok(intake_notes.some((n) => /unknown evidence requirement/.test(n)));
});
