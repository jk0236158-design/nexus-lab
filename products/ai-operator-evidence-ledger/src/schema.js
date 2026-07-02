// schema.js
// Canonical done-claim case schema + intake normalization.
//
// The core case fields mirror the documented case model:
//   claim_id, agent_name, claimed_outcome, artifact_ref, evidence_requirements,
//   decision_ref, risk_level, next_action_ref, review_window_hours, status, repair_action
//
// Intake takes a loose incoming claim (the kind an agent posts as text + a few
// fields) and normalizes it into this canonical shape so the verification engine
// always sees the same structure.

/** The fixed set of evidence checks the engine knows how to run. */
export const KNOWN_CHECKS = Object.freeze([
  "artifact_exists",
  "artifact_content_match",
  "test_pass_recorded",
  "decision_link_present",
  "next_action_visible",
  "recency_within_window",
]);

/** Verdict statuses a case can hold. */
export const STATUS = Object.freeze({
  INTAKE: "intake",
  EVIDENCE_BACKED: "evidence_backed",
  REJECTED_MISSING_PROOF: "rejected_missing_proof",
  STALE_AFTER_RECHECK: "stale_after_recheck",
});

export const RISK_LEVELS = Object.freeze(["low", "medium", "high"]);

/**
 * Normalize a raw incoming claim into the canonical case schema.
 * Unknown evidence requirements are dropped (with a note) rather than trusted,
 * so an agent cannot smuggle in a check the engine does not actually run.
 *
 * @param {object} raw
 * @returns {{ case: object, intake_notes: string[] }}
 */
export function normalizeClaim(raw) {
  const notes = [];

  if (raw == null || typeof raw !== "object") {
    throw new IntakeError("claim payload must be an object");
  }

  const claimId = requireString(raw.claim_id, "claim_id");
  const agentName = requireString(raw.agent_name, "agent_name");
  const claimedOutcome = requireString(raw.claimed_outcome, "claimed_outcome");

  // artifact_ref is optional at intake: a claim may legitimately arrive without
  // one, and the verification engine is what flags the missing proof.
  const artifactRef =
    raw.artifact_ref == null || raw.artifact_ref === ""
      ? null
      : String(raw.artifact_ref);

  // evidence_requirements: keep only checks the engine recognizes.
  const requestedReqs = Array.isArray(raw.evidence_requirements)
    ? raw.evidence_requirements.map(String)
    : [];
  const evidenceRequirements = [];
  for (const req of requestedReqs) {
    if (KNOWN_CHECKS.includes(req)) {
      if (!evidenceRequirements.includes(req)) {
        evidenceRequirements.push(req);
      }
    } else {
      notes.push(`dropped unknown evidence requirement: ${req}`);
    }
  }
  if (evidenceRequirements.length === 0) {
    notes.push("no recognized evidence requirements supplied; defaulting to artifact_exists");
    evidenceRequirements.push("artifact_exists");
  }

  const decisionRef =
    raw.decision_ref == null || raw.decision_ref === "" ? null : String(raw.decision_ref);
  const nextActionRef =
    raw.next_action_ref == null || raw.next_action_ref === ""
      ? null
      : String(raw.next_action_ref);

  let riskLevel = raw.risk_level == null ? "medium" : String(raw.risk_level).toLowerCase();
  if (!RISK_LEVELS.includes(riskLevel)) {
    notes.push(`unrecognized risk_level '${raw.risk_level}'; defaulting to medium`);
    riskLevel = "medium";
  }

  let reviewWindowHours = Number(raw.review_window_hours);
  if (!Number.isFinite(reviewWindowHours) || reviewWindowHours <= 0) {
    reviewWindowHours = 24;
    notes.push("review_window_hours missing or invalid; defaulting to 24");
  }

  const expectedContent =
    raw.expected_artifact_content == null ? null : String(raw.expected_artifact_content);

  const now = new Date().toISOString();

  const normalized = {
    claim_id: claimId,
    agent_name: agentName,
    claimed_outcome: claimedOutcome,
    artifact_ref: artifactRef,
    expected_artifact_content: expectedContent,
    evidence_requirements: evidenceRequirements,
    decision_ref: decisionRef,
    risk_level: riskLevel,
    next_action_ref: nextActionRef,
    review_window_hours: reviewWindowHours,
    status: STATUS.INTAKE,
    repair_action: null,
    // Temporal bookkeeping for the recency check / timed recheck.
    submitted_at: typeof raw.submitted_at === "string" ? raw.submitted_at : now,
    last_checked_at: null,
    last_verdict: null,
    history: [],
  };

  return { case: normalized, intake_notes: notes };
}

export class IntakeError extends Error {
  constructor(message) {
    super(message);
    this.name = "IntakeError";
  }
}

function requireString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new IntakeError(`${field} is required and must be a non-empty string`);
  }
  return value;
}
