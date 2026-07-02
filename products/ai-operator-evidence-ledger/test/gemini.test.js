// gemini.test.js
// Unit tests for the key-optional Gemini enrichment adapter. No real API key and
// no real network: the no-key path uses the deterministic fallback, and the
// "with key" path uses an injected mock fetch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { enrichClaim, localEnrichment, normalizeEnrichment } from "../src/gemini.js";
import { KNOWN_CHECKS } from "../src/schema.js";

function sampleCase(over = {}) {
  return {
    claim_id: "c",
    agent_name: "A",
    claimed_outcome: "Done. Build artifact created and deployment is ready.",
    artifact_ref: "missing-build.tar",
    expected_artifact_content: null,
    evidence_requirements: ["artifact_exists", "decision_link_present"],
    decision_ref: "dec-1",
    risk_level: "high",
    next_action_ref: "next-1",
    review_window_hours: 24,
    submitted_at: new Date().toISOString(),
    ...over,
  };
}

function verdict(over = {}) {
  return {
    verdict: "rejected_missing_proof",
    checks: [
      { check: "artifact_exists", passed: false, detail: "missing" },
      { check: "decision_link_present", passed: true, detail: "ok" },
    ],
    ...over,
  };
}

test("no key -> local fallback, never throws, valid shape", async () => {
  const en = await enrichClaim(sampleCase(), verdict(), { apiKey: "" });
  assert.equal(en.source, "local-fallback");
  assert.equal(typeof en.classification, "string");
  assert.ok(en.classification.length > 0);
  assert.ok(Array.isArray(en.suggested_evidence_types));
  // suggested types are a subset of known checks only
  for (const t of en.suggested_evidence_types) assert.ok(KNOWN_CHECKS.includes(t));
  assert.match(en.failure_summary, /missing required evidence/i);
});

test("local fallback classifies build artifacts and suggests undeclared checks", () => {
  const en = localEnrichment(sampleCase(), verdict());
  assert.equal(en.classification, "build_artifact");
  // declared: artifact_exists, decision_link_present -> these must NOT be suggested
  assert.ok(!en.suggested_evidence_types.includes("artifact_exists"));
  assert.ok(!en.suggested_evidence_types.includes("decision_link_present"));
  // an undeclared known check should be suggested
  assert.ok(en.suggested_evidence_types.includes("recency_within_window"));
});

test("local fallback summary differs by verdict", () => {
  const backed = localEnrichment(
    sampleCase(),
    verdict({ verdict: "evidence_backed", checks: [{ check: "artifact_exists", passed: true, detail: "ok" }] }),
  );
  assert.match(backed.failure_summary, /backed by the required evidence/i);

  const stale = localEnrichment(
    sampleCase(),
    verdict({ verdict: "stale_after_recheck", checks: [{ check: "recency_within_window", passed: false, detail: "old" }] }),
  );
  assert.match(stale.failure_summary, /review window passed/i);
});

test("with key + mock fetch -> uses Gemini path and normalizes output", async () => {
  const geminiBody = {
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                classification: "build_artifact",
                // includes a bogus check that must be dropped on normalize
                suggested_evidence_types: ["test_pass_recorded", "totally_made_up", "recency_within_window"],
                failure_summary: "The build artifact referenced by the claim is not present.",
              }),
            },
          ],
        },
      },
    ],
  };
  const mockFetch = async () => ({ ok: true, status: 200, json: async () => geminiBody });

  const en = await enrichClaim(sampleCase(), verdict(), { apiKey: "test-key", fetchImpl: mockFetch });
  assert.equal(en.source, "gemini");
  assert.equal(en.classification, "build_artifact");
  // bogus check dropped, known checks kept
  assert.deepEqual(en.suggested_evidence_types, ["test_pass_recorded", "recency_within_window"]);
  assert.match(en.failure_summary, /not present/);
});

test("with key but non-ok response -> falls back to local", async () => {
  const mockFetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  const en = await enrichClaim(sampleCase(), verdict(), { apiKey: "test-key", fetchImpl: mockFetch });
  assert.equal(en.source, "local-fallback");
});

test("with key but unparsable model text -> falls back to local", async () => {
  const body = { candidates: [{ content: { parts: [{ text: "this is not json" }] } }] };
  const mockFetch = async () => ({ ok: true, status: 200, json: async () => body });
  const en = await enrichClaim(sampleCase(), verdict(), { apiKey: "test-key", fetchImpl: mockFetch });
  assert.equal(en.source, "local-fallback");
});

test("with key but fetch throws / aborts -> falls back to local", async () => {
  const mockFetch = async () => {
    throw new Error("network down");
  };
  const en = await enrichClaim(sampleCase(), verdict(), { apiKey: "test-key", fetchImpl: mockFetch });
  assert.equal(en.source, "local-fallback");
});

test("timeout aborts the request and falls back", async () => {
  // fetch that honors the abort signal and never resolves otherwise.
  const mockFetch = (_url, opts) =>
    new Promise((_resolve, reject) => {
      opts.signal.addEventListener("abort", () => reject(new Error("aborted")));
    });
  const en = await enrichClaim(sampleCase(), verdict(), {
    apiKey: "test-key",
    fetchImpl: mockFetch,
    timeoutMs: 20,
  });
  assert.equal(en.source, "local-fallback");
});

test("normalizeEnrichment clips long strings and bounds source", () => {
  const long = "x ".repeat(400);
  const en = normalizeEnrichment(
    { classification: long, suggested_evidence_types: ["artifact_exists"], failure_summary: long },
    "gemini",
  );
  assert.ok(en.classification.length <= 48);
  assert.ok(en.failure_summary.length <= 240);
  assert.equal(en.source, "gemini");

  const bad = normalizeEnrichment({}, "weird-source");
  assert.equal(bad.source, "local-fallback");
  assert.equal(bad.classification, "general_done_claim");
  assert.deepEqual(bad.suggested_evidence_types, []);
});
