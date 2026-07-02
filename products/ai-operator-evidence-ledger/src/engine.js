// engine.js
// Verification engine: six fixed checks + verdict resolution.
//
// Each check is a pure-ish function over (caseRecord, ctx) that returns
//   { check, passed, detail }
// where ctx carries the artifacts root and the "now" clock (injectable so the
// timed recheck and the tests can move time deterministically).
//
// Verdict rules:
//   - If any *non-recency* required check fails -> rejected_missing_proof.
//   - Else if recency is required and fails -> stale_after_recheck.
//   - Else -> evidence_backed.
// This split matters: a missing artifact is a "never had proof" failure, while a
// recency failure is a "was true, decayed over time" failure. The demo's stale
// case relies on that distinction.

import fs from "node:fs";
import path from "node:path";
import { STATUS } from "./schema.js";

/**
 * @typedef {object} CheckResult
 * @property {string} check
 * @property {boolean} passed
 * @property {string} detail
 */

/**
 * Run all required checks for a case.
 * @param {object} caseRecord
 * @param {{ artifactsRoot: string, now?: Date }} ctx
 * @returns {{ verdict: string, checks: CheckResult[], repair_action: string|null, checked_at: string }}
 */
export function verifyCase(caseRecord, ctx) {
  const now = ctx.now ?? new Date();
  const required = caseRecord.evidence_requirements;
  const checks = [];

  for (const name of required) {
    const fn = CHECKS[name];
    if (!fn) {
      checks.push({ check: name, passed: false, detail: `no such check implemented: ${name}` });
      continue;
    }
    checks.push(fn(caseRecord, { ...ctx, now }));
  }

  const failedNonRecency = checks.filter((c) => !c.passed && c.check !== "recency_within_window");
  const recencyCheck = checks.find((c) => c.check === "recency_within_window");
  const recencyFailed = recencyCheck != null && !recencyCheck.passed;

  let verdict;
  let repairAction = null;
  if (failedNonRecency.length > 0) {
    verdict = STATUS.REJECTED_MISSING_PROOF;
    const missing = failedNonRecency.map((c) => c.check).join(", ");
    repairAction = `Re-open work and supply valid proof for: ${missing}. Done state is withheld until proof is attached.`;
  } else if (recencyFailed) {
    verdict = STATUS.STALE_AFTER_RECHECK;
    repairAction =
      "Claim was evidence-backed earlier but the review window has passed without a current next action. Re-attach a fresh, current next action before treating this as done.";
  } else {
    verdict = STATUS.EVIDENCE_BACKED;
  }

  return { verdict, checks, repair_action: repairAction, checked_at: now.toISOString() };
}

/** Resolve an artifact_ref against the artifacts root, safely (no path escape). */
function resolveArtifact(artifactRef, artifactsRoot) {
  if (!artifactRef) return null;
  const root = path.resolve(artifactsRoot);
  const full = path.resolve(root, artifactRef);
  if (full !== root && !full.startsWith(root + path.sep)) {
    return null; // refuse to read outside the artifacts root
  }
  return full;
}

export const CHECKS = {
  // 1. The referenced artifact file actually exists on disk.
  artifact_exists(caseRecord, ctx) {
    const full = resolveArtifact(caseRecord.artifact_ref, ctx.artifactsRoot);
    if (!caseRecord.artifact_ref) {
      return { check: "artifact_exists", passed: false, detail: "no artifact_ref supplied on the claim" };
    }
    if (!full) {
      return {
        check: "artifact_exists",
        passed: false,
        detail: `artifact_ref '${caseRecord.artifact_ref}' resolves outside the artifacts root`,
      };
    }
    const exists = fs.existsSync(full) && fs.statSync(full).isFile();
    return {
      check: "artifact_exists",
      passed: exists,
      detail: exists
        ? `artifact present at ${caseRecord.artifact_ref}`
        : `artifact not found at ${caseRecord.artifact_ref}`,
    };
  },

  // 2. The artifact's content contains the expected marker (proof that the
  //    change the claim describes is actually in the file).
  artifact_content_match(caseRecord, ctx) {
    const full = resolveArtifact(caseRecord.artifact_ref, ctx.artifactsRoot);
    if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
      return {
        check: "artifact_content_match",
        passed: false,
        detail: "cannot match content: artifact missing",
      };
    }
    const expected = caseRecord.expected_artifact_content;
    if (!expected) {
      // Nothing specific to match: existence already proven elsewhere, so this
      // is a soft pass rather than a silent failure.
      return {
        check: "artifact_content_match",
        passed: true,
        detail: "no expected content marker specified; treated as satisfied",
      };
    }
    const body = fs.readFileSync(full, "utf8");
    const matched = body.includes(expected);
    return {
      check: "artifact_content_match",
      passed: matched,
      detail: matched
        ? `artifact contains expected marker '${expected}'`
        : `artifact present but expected marker '${expected}' not found`,
    };
  },

  // 3. A recorded passing test result exists for this claim.
  test_pass_recorded(caseRecord, ctx) {
    const full = resolveArtifact(caseRecord.artifact_ref, ctx.artifactsRoot);
    // Convention: a sibling <artifact>.test.json with { passed: true }.
    if (!full) {
      return {
        check: "test_pass_recorded",
        passed: false,
        detail: "no artifact to anchor a test record",
      };
    }
    const testRecordPath = full + ".test.json";
    if (!fs.existsSync(testRecordPath)) {
      return {
        check: "test_pass_recorded",
        passed: false,
        detail: "no recorded test result alongside the artifact",
      };
    }
    try {
      const rec = JSON.parse(fs.readFileSync(testRecordPath, "utf8"));
      const passed = rec.passed === true;
      return {
        check: "test_pass_recorded",
        passed,
        detail: passed
          ? `recorded test result: passed (${rec.suite ?? "suite"})`
          : "recorded test result present but not passing",
      };
    } catch (err) {
      return {
        check: "test_pass_recorded",
        passed: false,
        detail: `test record unreadable: ${err.message}`,
      };
    }
  },

  // 4. The claim links to a governing decision.
  decision_link_present(caseRecord) {
    const present = typeof caseRecord.decision_ref === "string" && caseRecord.decision_ref !== "";
    return {
      check: "decision_link_present",
      passed: present,
      detail: present
        ? `decision linked: ${caseRecord.decision_ref}`
        : "no decision_ref linked to the claim",
    };
  },

  // 5. A next action is visible (the claim does not dead-end).
  next_action_visible(caseRecord) {
    const present = typeof caseRecord.next_action_ref === "string" && caseRecord.next_action_ref !== "";
    return {
      check: "next_action_visible",
      passed: present,
      detail: present
        ? `next action visible: ${caseRecord.next_action_ref}`
        : "no next_action_ref visible on the claim",
    };
  },

  // 6. The claim is recent enough: submitted_at within review_window_hours of now.
  //    This is the time axis. On first check it usually passes; after the window
  //    elapses (simulated by advancing ctx.now), it flips and the case goes stale.
  recency_within_window(caseRecord, ctx) {
    const submitted = new Date(caseRecord.submitted_at).getTime();
    const now = ctx.now.getTime();
    const windowMs = caseRecord.review_window_hours * 60 * 60 * 1000;
    const ageMs = now - submitted;
    const withinWindow = ageMs <= windowMs;
    const ageHours = (ageMs / (60 * 60 * 1000)).toFixed(2);
    return {
      check: "recency_within_window",
      passed: withinWindow,
      detail: withinWindow
        ? `claim age ${ageHours}h is within the ${caseRecord.review_window_hours}h review window`
        : `claim age ${ageHours}h exceeds the ${caseRecord.review_window_hours}h review window`,
    };
  },
};
