// engine.test.js
// Unit tests for each of the six fixed checks, using a temp artifacts root.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CHECKS, verifyCase } from "../src/engine.js";
import { STATUS } from "../src/schema.js";

function tmpRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-test-"));
  return dir;
}

function baseCase(over = {}) {
  return {
    claim_id: "c",
    agent_name: "A",
    claimed_outcome: "done",
    artifact_ref: null,
    expected_artifact_content: null,
    evidence_requirements: [],
    decision_ref: "dec-1",
    risk_level: "low",
    next_action_ref: "next-1",
    review_window_hours: 24,
    submitted_at: new Date().toISOString(),
    ...over,
  };
}

test("artifact_exists: passes when file present, fails when absent", () => {
  const root = tmpRoot();
  fs.writeFileSync(path.join(root, "a.txt"), "hello");
  const ctx = { artifactsRoot: root, now: new Date() };

  assert.equal(CHECKS.artifact_exists(baseCase({ artifact_ref: "a.txt" }), ctx).passed, true);
  assert.equal(CHECKS.artifact_exists(baseCase({ artifact_ref: "nope.txt" }), ctx).passed, false);
  assert.equal(CHECKS.artifact_exists(baseCase({ artifact_ref: null }), ctx).passed, false);
});

test("artifact_exists: refuses path escape outside artifacts root", () => {
  const root = tmpRoot();
  const ctx = { artifactsRoot: root, now: new Date() };
  const r = CHECKS.artifact_exists(baseCase({ artifact_ref: "../../secret" }), ctx);
  assert.equal(r.passed, false);
  assert.match(r.detail, /outside the artifacts root/);
});

test("artifact_content_match: matches marker, fails on missing marker", () => {
  const root = tmpRoot();
  fs.writeFileSync(path.join(root, "a.txt"), "alpha MARKER beta");
  const ctx = { artifactsRoot: root, now: new Date() };

  assert.equal(
    CHECKS.artifact_content_match(
      baseCase({ artifact_ref: "a.txt", expected_artifact_content: "MARKER" }),
      ctx,
    ).passed,
    true,
  );
  assert.equal(
    CHECKS.artifact_content_match(
      baseCase({ artifact_ref: "a.txt", expected_artifact_content: "ABSENT" }),
      ctx,
    ).passed,
    false,
  );
});

test("test_pass_recorded: needs a sibling .test.json with passed:true", () => {
  const root = tmpRoot();
  fs.writeFileSync(path.join(root, "a.txt"), "x");
  const ctx = { artifactsRoot: root, now: new Date() };

  // no record yet
  assert.equal(CHECKS.test_pass_recorded(baseCase({ artifact_ref: "a.txt" }), ctx).passed, false);

  fs.writeFileSync(path.join(root, "a.txt.test.json"), JSON.stringify({ passed: true }));
  assert.equal(CHECKS.test_pass_recorded(baseCase({ artifact_ref: "a.txt" }), ctx).passed, true);

  fs.writeFileSync(path.join(root, "a.txt.test.json"), JSON.stringify({ passed: false }));
  assert.equal(CHECKS.test_pass_recorded(baseCase({ artifact_ref: "a.txt" }), ctx).passed, false);
});

test("decision_link_present + next_action_visible", () => {
  assert.equal(CHECKS.decision_link_present(baseCase({ decision_ref: "d" })).passed, true);
  assert.equal(CHECKS.decision_link_present(baseCase({ decision_ref: null })).passed, false);
  assert.equal(CHECKS.next_action_visible(baseCase({ next_action_ref: "n" })).passed, true);
  assert.equal(CHECKS.next_action_visible(baseCase({ next_action_ref: null })).passed, false);
});

test("recency_within_window: flips false once now exceeds window", () => {
  const submitted = new Date("2026-01-01T00:00:00.000Z");
  const c = baseCase({ submitted_at: submitted.toISOString(), review_window_hours: 6 });

  const within = new Date(submitted.getTime() + 3 * 3600 * 1000);
  assert.equal(CHECKS.recency_within_window(c, { artifactsRoot: "x", now: within }).passed, true);

  const beyond = new Date(submitted.getTime() + 9 * 3600 * 1000);
  assert.equal(CHECKS.recency_within_window(c, { artifactsRoot: "x", now: beyond }).passed, false);
});

test("verifyCase: missing non-recency proof -> rejected_missing_proof", () => {
  const root = tmpRoot();
  const ctx = { artifactsRoot: root, now: new Date() };
  const c = baseCase({
    artifact_ref: "gone.tar",
    evidence_requirements: ["artifact_exists", "decision_link_present"],
  });
  const r = verifyCase(c, ctx);
  assert.equal(r.verdict, STATUS.REJECTED_MISSING_PROOF);
  assert.ok(r.repair_action);
});

test("verifyCase: only recency fails -> stale_after_recheck", () => {
  const root = tmpRoot();
  fs.writeFileSync(path.join(root, "a.txt"), "x");
  const submitted = new Date("2026-01-01T00:00:00.000Z");
  const c = baseCase({
    artifact_ref: "a.txt",
    submitted_at: submitted.toISOString(),
    review_window_hours: 6,
    evidence_requirements: ["artifact_exists", "decision_link_present", "recency_within_window"],
  });
  const beyond = new Date(submitted.getTime() + 9 * 3600 * 1000);
  const r = verifyCase(c, { artifactsRoot: root, now: beyond });
  assert.equal(r.verdict, STATUS.STALE_AFTER_RECHECK);
});
