// server.js
// Minimal HTTP surface + dashboard for the AI Operator Evidence Ledger.
// Single web service, binds 0.0.0.0:PORT (Cloud Run convention). No framework,
// no external dependencies, synthetic data only.
//
// Routes:
//   GET  /                     -> HTML dashboard (3 cases, verdicts, proof summary)
//   GET  /healthz, /health     -> liveness probe (/health is the run.app-safe alias)
//   GET  /api/cases            -> JSON: all case summaries
//   GET  /api/cases/:id        -> JSON: one case summary
//   POST /api/claims           -> intake a new raw claim (normalize + store)
//   POST /api/check            -> { now? } run a verification pass over all cases
//   POST /api/recheck          -> { advance_hours? } timed recheck (advances clock)
//   POST /api/enrich           -> re-run the Gemini-backed enrichment over all cases
//
// The enrichment step (claim classification / suggested evidence / public-safe
// failure summary) uses the Google Gemini API when GEMINI_API_KEY is set, and a
// deterministic local fallback otherwise. The service therefore runs and is
// testable with no key and no network.

import http from "node:http";
import { Ledger } from "./ledger.js";
import { writeArtifacts, sampleClaims, ARTIFACTS_ROOT } from "./seed.js";
import { renderDashboard } from "./dashboard.js";

const PORT = Number(process.env.PORT) || 8080;

export function buildLedger() {
  writeArtifacts();
  const ledger = new Ledger({ artifactsRoot: ARTIFACTS_ROOT });
  for (const claim of sampleClaims()) {
    ledger.intake(claim);
  }
  // Initial verification pass at the current clock: happy + stale go green,
  // missing is rejected. check() attaches the deterministic local enrichment.
  ledger.check("claim-happy-readme-tests");
  ledger.check("claim-missing-artifact");
  ledger.check("claim-stale-next-action");
  return ledger;
}

/**
 * Build the ledger and overlay the Gemini-backed enrichment. If GEMINI_API_KEY is
 * absent (or the call fails) every case keeps its local enrichment, so this never
 * throws and never blocks startup. Used by the live server entrypoint.
 */
export async function buildLedgerWithEnrichment() {
  const ledger = buildLedger();
  await ledger.enrichAll();
  return ledger;
}

export function createServer(ledger) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
      const { method } = req;

      // "/health" is the alias to use through Cloud Run's public run.app URL:
      // Google's frontend intercepts "/healthz" before it reaches the container
      // and serves its own 404, so the canonical probe path never answers there.
      if (method === "GET" && (url.pathname === "/healthz" || url.pathname === "/health")) {
        return sendJson(res, 200, { status: "ok" });
      }

      if (method === "GET" && url.pathname === "/") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(renderDashboard(ledger.summary()));
        return;
      }

      if (method === "GET" && url.pathname === "/api/cases") {
        return sendJson(res, 200, { cases: ledger.summary() });
      }

      const caseMatch = url.pathname.match(/^\/api\/cases\/([^/]+)$/);
      if (method === "GET" && caseMatch) {
        const found = ledger.summary().find((c) => c.claim_id === caseMatch[1]);
        if (!found) return sendJson(res, 404, { error: "not found" });
        return sendJson(res, 200, found);
      }

      if (method === "POST" && url.pathname === "/api/claims") {
        const body = await readJson(req);
        const c = ledger.intake(body);
        const verdict = ledger.check(c.claim_id);
        return sendJson(res, 201, { claim_id: c.claim_id, status: c.status, verdict });
      }

      if (method === "POST" && url.pathname === "/api/check") {
        const body = await readJson(req).catch(() => ({}));
        const now = body && body.now ? new Date(body.now) : undefined;
        const results = ledger.recheckAll({ now });
        return sendJson(res, 200, { results });
      }

      if (method === "POST" && url.pathname === "/api/recheck") {
        const body = await readJson(req).catch(() => ({}));
        const advanceHours = Number(body && body.advance_hours) || 0;
        const now = new Date(Date.now() + advanceHours * 60 * 60 * 1000);
        const results = ledger.recheckAll({ now });
        return sendJson(res, 200, { advanced_hours: advanceHours, checked_at: now.toISOString(), results });
      }

      if (method === "POST" && url.pathname === "/api/enrich") {
        // Re-run the Gemini-backed enrichment (or local fallback) over all cases.
        const results = await ledger.enrichAll();
        const usingGemini = results.some((r) => r.enrichment?.source === "gemini");
        return sendJson(res, 200, { source: usingGemini ? "gemini" : "local-fallback", results });
      }

      return sendJson(res, 404, { error: "not found" });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  });
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("payload too large"));
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// Start only when run directly (tests import createServer without listening).
if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  const ledger = await buildLedgerWithEnrichment();
  const server = createServer(ledger);
  const usingGemini = ledger.summary().some((c) => c.enrichment?.source === "gemini");
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Evidence Ledger service listening on http://0.0.0.0:${PORT}`);
    console.log(
      `Enrichment source: ${usingGemini ? "Gemini API (GEMINI_API_KEY set)" : "local fallback (no GEMINI_API_KEY)"}.`,
    );
    console.log("Open / for the dashboard. Synthetic demo data only.");
  });
}
