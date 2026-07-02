// seed.js
// Synthetic demo data. Writes the artifact files the happy/stale cases point at,
// and returns the three raw claims used to populate the ledger.
//
// All data here is synthetic and illustrative. It is not derived from real work
// logs, credentials, or private data.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ARTIFACTS_ROOT = path.resolve(__dirname, "..", "data", "artifacts");

/**
 * Write the on-disk artifacts that the synthetic cases reference.
 * The happy and stale cases have real files + test records; the missing case
 * intentionally has none.
 */
export function writeArtifacts(root = ARTIFACTS_ROOT) {
  fs.mkdirSync(root, { recursive: true });

  // Happy case: a README with the expected marker, plus a passing test record.
  const readmePath = path.join(root, "happy-readme.md");
  fs.writeFileSync(
    readmePath,
    [
      "# Sample Service README",
      "",
      "## Setup",
      "Run `npm install` then `npm start`.",
      "",
      "<!-- evidence-marker: setup-section-added -->",
      "",
    ].join("\n"),
    "utf8",
  );
  fs.writeFileSync(
    readmePath + ".test.json",
    JSON.stringify({ suite: "readme-smoke", passed: true, total: 4, failed: 0 }, null, 2),
    "utf8",
  );

  // Stale case: artifact exists and is fine; the case goes stale only because
  // its review window elapses, not because the file is wrong.
  const followPath = path.join(root, "stale-followthrough.md");
  fs.writeFileSync(
    followPath,
    ["# Post-review follow-through note", "", "Review completed; follow-up captured here.", ""].join("\n"),
    "utf8",
  );

  // Missing case: deliberately do NOT create data/artifacts/missing-build.tar.
  const missingPath = path.join(root, "missing-build.tar");
  if (fs.existsSync(missingPath)) fs.rmSync(missingPath);

  return { readmePath, followPath, missingPath };
}

/**
 * The three synthetic raw claims.
 * @param {object} [opts]
 * @param {string} [opts.staleSubmittedAt] - override submitted_at for the stale
 *   case so a single recheck can flip it (used by the timed-recheck demo/tests).
 */
export function sampleClaims(opts = {}) {
  const nowIso = new Date().toISOString();

  return [
    {
      claim_id: "claim-happy-readme-tests",
      agent_name: "OpsAgent",
      claimed_outcome: "Task complete. README updated, tests passed, deploy ready.",
      artifact_ref: "happy-readme.md",
      expected_artifact_content: "evidence-marker: setup-section-added",
      evidence_requirements: [
        "artifact_exists",
        "artifact_content_match",
        "test_pass_recorded",
        "decision_link_present",
        "next_action_visible",
        "recency_within_window",
      ],
      decision_ref: "decision-local-green-001",
      risk_level: "low",
      next_action_ref: "next-record-demo-video",
      review_window_hours: 24,
      submitted_at: nowIso,
    },
    {
      claim_id: "claim-missing-artifact",
      agent_name: "BuildAgent",
      claimed_outcome: "Done. Build artifact created and deployment is ready.",
      artifact_ref: "missing-build.tar",
      expected_artifact_content: null,
      evidence_requirements: [
        "artifact_exists",
        "artifact_content_match",
        "test_pass_recorded",
        "decision_link_present",
      ],
      decision_ref: "decision-review-required-014",
      risk_level: "high",
      next_action_ref: "next-repair-missing-build-proof",
      review_window_hours: 24,
      submitted_at: nowIso,
    },
    {
      claim_id: "claim-stale-next-action",
      agent_name: "RunAgent",
      claimed_outcome: "Done. Review complete and next action queued.",
      artifact_ref: "stale-followthrough.md",
      expected_artifact_content: null,
      evidence_requirements: [
        "artifact_exists",
        "artifact_content_match",
        "decision_link_present",
        "next_action_visible",
        "recency_within_window",
      ],
      decision_ref: "decision-time-axis-watch-006",
      risk_level: "medium",
      next_action_ref: "next-follow-through-current",
      review_window_hours: 6,
      // Default: submitted now (first check is green). The recheck demo advances
      // the clock past the 6h window to flip it stale.
      submitted_at: opts.staleSubmittedAt ?? nowIso,
    },
  ];
}

// Allow `npm run seed` to materialize artifacts standalone.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed.js")) {
  const written = writeArtifacts();
  console.log("seed artifacts written under", ARTIFACTS_ROOT);
  console.log(written);
}
