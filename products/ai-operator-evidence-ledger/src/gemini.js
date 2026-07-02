// gemini.js
// Key-optional enrichment layer backed by the Google Gemini API.
//
// What it adds to a verified case:
//   - classification: a short label for the kind of done-claim (e.g.
//     "build_artifact", "doc_update", "review_followthrough").
//   - suggested_evidence_types: evidence checks that would strengthen the claim.
//   - failure_summary: a public-safe, one-line plain-language reason a claim was
//     not evidence-backed (only meaningful for rejected / stale verdicts).
//
// Design contract:
//   - If GEMINI_API_KEY is set, call the Gemini REST endpoint (generativelanguage
//     .googleapis.com) with a hard timeout. This is a thin fetch adapter; no SDK.
//   - On ANY failure (no key, network error, timeout, bad shape, unparsable
//     output) fall back to a deterministic local function so the service keeps
//     working and tests pass with no key and no network.
//   - The "source" field always reports which path produced the result, so the
//     dashboard and API can show whether Gemini or the local fallback answered.
//
// No private data is sent: only the synthetic claim's outcome text, declared
// requirements, and the local verdict/check names are included in the prompt.

import { KNOWN_CHECKS } from "./schema.js";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 8000;

/** @typedef {object} Enrichment
 * @property {string} classification
 * @property {string[]} suggested_evidence_types
 * @property {string} failure_summary
 * @property {"gemini"|"local-fallback"} source
 */

/**
 * Enrich a verified case with a classification, suggested evidence types, and a
 * public-safe failure summary. Always resolves; never throws.
 *
 * @param {object} caseRecord - normalized case
 * @param {{ verdict: string, checks: {check:string,passed:boolean,detail:string}[] }} verdict
 * @param {object} [opts]
 * @param {string} [opts.apiKey] - overrides process.env.GEMINI_API_KEY (tests)
 * @param {typeof fetch} [opts.fetchImpl] - injectable fetch (tests)
 * @param {number} [opts.timeoutMs]
 * @param {string} [opts.model]
 * @returns {Promise<Enrichment>}
 */
export async function enrichClaim(caseRecord, verdict, opts = {}) {
  const apiKey = opts.apiKey ?? process.env.GEMINI_API_KEY ?? "";

  if (!apiKey) {
    return localEnrichment(caseRecord, verdict);
  }

  try {
    const remote = await callGemini(caseRecord, verdict, {
      apiKey,
      fetchImpl: opts.fetchImpl ?? fetch,
      timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      model: opts.model ?? DEFAULT_MODEL,
    });
    return normalizeEnrichment(remote, "gemini");
  } catch {
    // Any remote failure degrades silently to the deterministic local path.
    return localEnrichment(caseRecord, verdict);
  }
}

/**
 * Deterministic, no-network enrichment. This is the fallback and also the shape
 * the Gemini output is normalized into, so both paths return identical fields.
 * @returns {Enrichment}
 */
export function localEnrichment(caseRecord, verdict) {
  const classification = classify(caseRecord);

  const declared = new Set(caseRecord.evidence_requirements ?? []);
  const suggested = KNOWN_CHECKS.filter((c) => !declared.has(c));

  const failed = (verdict.checks ?? []).filter((c) => !c.passed).map((c) => c.check);
  const failure_summary = summarizeFailure(verdict.verdict, failed);

  return {
    classification,
    suggested_evidence_types: suggested,
    failure_summary,
    source: "local-fallback",
  };
}

/** Rough, rule-based classification used by the fallback. */
function classify(caseRecord) {
  const text = `${caseRecord.claimed_outcome ?? ""} ${caseRecord.artifact_ref ?? ""}`.toLowerCase();
  if (/\b(build|artifact|image|binary|\.tar|package)\b/.test(text)) return "build_artifact";
  if (/\b(readme|doc|docs|markdown|\.md)\b/.test(text)) return "doc_update";
  if (/\b(review|follow|next action|queued)\b/.test(text)) return "review_followthrough";
  if (/\b(deploy|deployment|release|ship)\b/.test(text)) return "deploy_claim";
  if (/\b(test|tests|coverage)\b/.test(text)) return "test_result";
  return "general_done_claim";
}

/** Public-safe, one-line failure summary. No internal names or paths. */
function summarizeFailure(verdictStatus, failedChecks) {
  if (verdictStatus === "evidence_backed") {
    return "Claim is backed by the required evidence at this time.";
  }
  if (verdictStatus === "stale_after_recheck") {
    return "Claim was backed earlier but the review window passed without a current next action.";
  }
  if (failedChecks.length === 0) {
    return "Claim is not fully evidence-backed.";
  }
  const human = failedChecks.map(humanCheckName).join(", ");
  return `Claim is missing required evidence: ${human}.`;
}

function humanCheckName(check) {
  const map = {
    artifact_exists: "the referenced artifact is not present",
    artifact_content_match: "the artifact does not contain the expected proof marker",
    test_pass_recorded: "no recorded passing test result",
    decision_link_present: "no linked governing decision",
    next_action_visible: "no visible next action",
    recency_within_window: "the claim is outside its review window",
  };
  return map[check] ?? check;
}

/**
 * Call the Gemini REST endpoint and return its parsed JSON suggestion object.
 * Throws on any non-ok response, timeout, or unparsable body.
 */
async function callGemini(caseRecord, verdict, { apiKey, fetchImpl, timeoutMs, model }) {
  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = buildPrompt(caseRecord, verdict);
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res || !res.ok) {
    throw new Error(`gemini request failed: ${res ? res.status : "no response"}`);
  }

  const data = await res.json();
  const text = extractText(data);
  if (!text) throw new Error("gemini response had no text candidate");

  const parsed = JSON.parse(text);
  if (parsed == null || typeof parsed !== "object") {
    throw new Error("gemini output was not a JSON object");
  }
  return parsed;
}

/** Pull the model's text out of the Gemini candidates structure. */
function extractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("").trim();
}

/**
 * Coerce an arbitrary suggestion object (from Gemini or local) into the strict
 * Enrichment shape. Unknown evidence types are dropped so the model cannot inject
 * a check the engine does not run; strings are bounded to keep output public-safe.
 * @returns {Enrichment}
 */
export function normalizeEnrichment(obj, source) {
  const classification =
    typeof obj.classification === "string" && obj.classification.trim() !== ""
      ? clip(obj.classification, 48)
      : "general_done_claim";

  const rawTypes = Array.isArray(obj.suggested_evidence_types) ? obj.suggested_evidence_types : [];
  const suggested = [];
  for (const t of rawTypes) {
    const s = String(t);
    if (KNOWN_CHECKS.includes(s) && !suggested.includes(s)) suggested.push(s);
  }

  const failure_summary =
    typeof obj.failure_summary === "string" && obj.failure_summary.trim() !== ""
      ? clip(obj.failure_summary, 240)
      : "No summary available.";

  return {
    classification,
    suggested_evidence_types: suggested,
    failure_summary,
    source: source === "gemini" ? "gemini" : "local-fallback",
  };
}

function clip(s, max) {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** Build the instruction prompt. Only synthetic claim fields are included. */
function buildPrompt(caseRecord, verdict) {
  const failed = (verdict.checks ?? []).filter((c) => !c.passed).map((c) => c.check);
  return [
    "You classify an AI operator's completion claim and suggest verification evidence.",
    "Respond with a single JSON object and nothing else, with exactly these keys:",
    '  "classification": a short snake_case label for the kind of claim,',
    `  "suggested_evidence_types": an array drawn only from this set: ${JSON.stringify(KNOWN_CHECKS)},`,
    '  "failure_summary": one plain-language sentence, no file paths, no proper nouns.',
    "",
    "Claim outcome text:",
    JSON.stringify(caseRecord.claimed_outcome ?? ""),
    "Declared evidence requirements:",
    JSON.stringify(caseRecord.evidence_requirements ?? []),
    "Local verdict:",
    JSON.stringify(verdict.verdict ?? "unknown"),
    "Checks that failed locally:",
    JSON.stringify(failed),
  ].join("\n");
}
