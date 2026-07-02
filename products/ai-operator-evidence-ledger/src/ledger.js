// ledger.js
// In-memory case store that ties intake -> verify -> recheck together.
// Holds the canonical cases, runs the engine, and records verdict history so
// the timed recheck can show a case flipping from green to stale.

import { normalizeClaim } from "./schema.js";
import { verifyCase } from "./engine.js";
import { localEnrichment } from "./gemini.js";

export class Ledger {
  /** @param {{ artifactsRoot: string }} opts */
  constructor(opts) {
    this.artifactsRoot = opts.artifactsRoot;
    /** @type {Map<string, object>} */
    this.cases = new Map();
  }

  /** Intake: normalize a raw claim and store it (no verdict yet). */
  intake(rawClaim) {
    const { case: c, intake_notes } = normalizeClaim(rawClaim);
    if (this.cases.has(c.claim_id)) {
      throw new Error(`claim_id already exists: ${c.claim_id}`);
    }
    c.intake_notes = intake_notes;
    this.cases.set(c.claim_id, c);
    return c;
  }

  /**
   * Run verification for one case and fold the verdict back into the record.
   * Attaches the deterministic (local) enrichment synchronously so the core
   * always has classification / suggested evidence / failure summary even with
   * no Gemini key and no network. A Gemini overlay can be applied afterwards via
   * enrich().
   * @param {string} claimId
   * @param {{ now?: Date }} [opts]
   */
  check(claimId, opts = {}) {
    const c = this.cases.get(claimId);
    if (!c) throw new Error(`unknown claim_id: ${claimId}`);
    const result = verifyCase(c, { artifactsRoot: this.artifactsRoot, now: opts.now });

    c.status = result.verdict;
    c.repair_action = result.repair_action;
    c.last_checked_at = result.checked_at;
    c.last_verdict = {
      verdict: result.verdict,
      checks: result.checks,
      checked_at: result.checked_at,
    };
    c.enrichment = localEnrichment(c, c.last_verdict);
    c.history.push({
      checked_at: result.checked_at,
      verdict: result.verdict,
      passed: result.checks.filter((x) => x.passed).length,
      failed: result.checks.filter((x) => !x.passed).length,
    });
    return c.last_verdict;
  }

  /**
   * Overlay the Gemini-backed enrichment onto an already-checked case. Falls back
   * to the local enrichment if no key is configured or the call fails, so this is
   * always safe to call. Async because it may reach the network.
   * @param {string} claimId
   * @param {object} [opts] - forwarded to enrichClaim (apiKey, fetchImpl, ...)
   */
  async enrich(claimId, opts = {}) {
    const c = this.cases.get(claimId);
    if (!c) throw new Error(`unknown claim_id: ${claimId}`);
    if (!c.last_verdict) this.check(claimId);
    const { enrichClaim } = await import("./gemini.js");
    c.enrichment = await enrichClaim(c, c.last_verdict, opts);
    return c.enrichment;
  }

  /** Overlay Gemini enrichment across every case. */
  async enrichAll(opts = {}) {
    const out = [];
    for (const id of this.cases.keys()) {
      out.push({ claim_id: id, enrichment: await this.enrich(id, opts) });
    }
    return out;
  }

  /** Re-run verification for every case (the timed recheck pass). */
  recheckAll(opts = {}) {
    const out = [];
    for (const id of this.cases.keys()) {
      out.push({ claim_id: id, verdict: this.check(id, opts).verdict });
    }
    return out;
  }

  get(claimId) {
    return this.cases.get(claimId) ?? null;
  }

  list() {
    return [...this.cases.values()];
  }

  /** Public-safe summary for the dashboard / API. */
  summary() {
    return this.list().map((c) => ({
      claim_id: c.claim_id,
      agent_name: c.agent_name,
      claimed_outcome: c.claimed_outcome,
      risk_level: c.risk_level,
      review_window_hours: c.review_window_hours,
      status: c.status,
      decision_ref: c.decision_ref,
      next_action_ref: c.next_action_ref,
      repair_action: c.repair_action,
      last_checked_at: c.last_checked_at,
      checks: c.last_verdict ? c.last_verdict.checks : [],
      enrichment: c.enrichment ?? null,
      history: c.history,
    }));
  }
}
