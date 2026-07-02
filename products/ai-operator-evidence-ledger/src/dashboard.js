// dashboard.js
// Server-rendered HTML dashboard for the three demo cases. No client framework,
// no external assets. Shows each case's current verdict, the per-check proof
// summary, and the repair action when one applies.

const VERDICT_STYLE = {
  evidence_backed: { label: "evidence-backed", bg: "#41502f", fg: "#f4efe1" },
  rejected_missing_proof: { label: "rejected (missing proof)", bg: "#7a3b2e", fg: "#f4efe1" },
  stale_after_recheck: { label: "stale (after recheck)", bg: "#8a6d3b", fg: "#f4efe1" },
  intake: { label: "intake", bg: "#5b594f", fg: "#f4efe1" },
};

export function renderDashboard(cases) {
  const cards = cases.map(renderCard).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>AI Operator Evidence Ledger</title>
<style>
  :root {
    --ivory: #f4efe1;
    --sumi: #2b2a26;
    --olive: #41502f;
    --wood: #8a6d3b;
    --line: #d8d0bd;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--ivory);
    color: var(--sumi);
    font-family: "Noto Sans JP", system-ui, -apple-system, Segoe UI, sans-serif;
    line-height: 1.6;
  }
  header {
    padding: 2.5rem 1.5rem 1.5rem;
    max-width: 900px;
    margin: 0 auto;
  }
  h1 {
    font-family: "Noto Serif JP", Georgia, serif;
    font-weight: 600;
    font-size: 1.7rem;
    margin: 0 0 0.4rem;
    letter-spacing: 0.01em;
  }
  .lede { max-width: 60ch; color: #4a4840; margin: 0; }
  .disclosure {
    margin: 1rem 0 0;
    font-size: 0.8rem;
    color: #6b675c;
    border-left: 2px solid var(--line);
    padding-left: 0.8rem;
  }
  main { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; }
  .case {
    background: #fbf8ef;
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 1.25rem 1.4rem;
    margin: 1.1rem 0;
  }
  .case-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
  .case-id { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace; font-size: 0.9rem; }
  .agent { color: #6b675c; font-size: 0.85rem; }
  .verdict {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 0.78rem;
    padding: 0.2rem 0.6rem;
    border-radius: 3px;
    white-space: nowrap;
  }
  .outcome { margin: 0.5rem 0 0.9rem; color: #4a4840; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  td { padding: 0.3rem 0.4rem; border-bottom: 1px solid var(--line); vertical-align: top; }
  .check-name { font-family: "JetBrains Mono", ui-monospace, monospace; white-space: nowrap; width: 12.5rem; }
  .pass { color: var(--olive); font-weight: 600; }
  .fail { color: #7a3b2e; font-weight: 600; }
  .repair {
    margin-top: 0.9rem;
    background: #f6eede;
    border: 1px solid #e4d6b4;
    border-radius: 3px;
    padding: 0.6rem 0.8rem;
    font-size: 0.85rem;
  }
  .enrich {
    margin-top: 0.9rem;
    border-top: 1px dashed var(--line);
    padding-top: 0.7rem;
    font-size: 0.82rem;
    color: #4a4840;
  }
  .enrich .src {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 0.72rem;
    color: #6b675c;
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 0.05rem 0.4rem;
    margin-left: 0.4rem;
  }
  .enrich ul { margin: 0.3rem 0 0; padding-left: 1.1rem; }
  .enrich .tag {
    font-family: "JetBrains Mono", ui-monospace, monospace;
    font-size: 0.78rem;
  }
  .meta { margin-top: 0.7rem; font-size: 0.78rem; color: #6b675c; }
  footer { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; font-size: 0.78rem; color: #6b675c; }
  code { font-family: "JetBrains Mono", ui-monospace, monospace; }
</style>
</head>
<body>
<header>
  <h1>AI Operator Evidence Ledger</h1>
  <p class="lede">A narrow control layer that checks whether an AI operator's "done" claim is backed by proof now, and rechecks whether it stays connected to a next action after a review window passes.</p>
  <p class="lede">Each case is enriched with an AI step (Google Gemini API when configured, deterministic local fallback otherwise) that classifies the claim, suggests evidence types, and writes a plain-language summary. The "source" label on each card shows which path produced it.</p>
  <p class="disclosure">Synthetic demo. These cases are illustrative examples of operating failure modes, not real work logs, customer data, or credentials.</p>
</header>
<main>
${cards}
</main>
<footer>
  <p>Endpoints: <code>GET /api/cases</code>, <code>POST /api/check</code>, <code>POST /api/recheck {"advance_hours": 12}</code>, <code>POST /api/enrich</code>, <code>GET /healthz</code>.</p>
  <p>A recheck advances the clock past a case's review window to show a previously green claim flipping to stale.</p>
</footer>
</body>
</html>`;
}

function renderCard(c) {
  const style = VERDICT_STYLE[c.status] ?? VERDICT_STYLE.intake;
  const rows = (c.checks || [])
    .map(
      (ch) => `    <tr>
      <td class="check-name">${esc(ch.check)}</td>
      <td class="${ch.passed ? "pass" : "fail"}">${ch.passed ? "PASS" : "FAIL"}</td>
      <td>${esc(ch.detail)}</td>
    </tr>`,
    )
    .join("\n");

  const repair = c.repair_action
    ? `  <div class="repair"><strong>Repair action:</strong> ${esc(c.repair_action)}</div>`
    : "";

  const enrich = renderEnrichment(c.enrichment);

  return `<section class="case">
  <div class="case-head">
    <div>
      <div class="case-id">${esc(c.claim_id)}</div>
      <div class="agent">claimed by ${esc(c.agent_name)} &middot; risk: ${esc(c.risk_level)} &middot; window: ${esc(
        String(c.review_window_hours),
      )}h</div>
    </div>
    <span class="verdict" style="background:${style.bg};color:${style.fg}">${esc(style.label)}</span>
  </div>
  <p class="outcome">&ldquo;${esc(c.claimed_outcome)}&rdquo;</p>
  <table>
${rows}
  </table>
${repair}
${enrich}
  <div class="meta">decision: <code>${esc(c.decision_ref ?? "none")}</code> &middot; next action: <code>${esc(
    c.next_action_ref ?? "none",
  )}</code> &middot; last checked: ${esc(c.last_checked_at ?? "not yet")}</div>
</section>`;
}

/** Render the Gemini / local-fallback enrichment block for a case. */
function renderEnrichment(en) {
  if (!en) return "";
  const sourceLabel = en.source === "gemini" ? "Gemini API" : "local fallback";
  const suggested = (en.suggested_evidence_types || [])
    .map((t) => `<li class="tag">${esc(t)}</li>`)
    .join("");
  const suggestedBlock = suggested
    ? `<div>Suggested evidence to strengthen this claim:<ul>${suggested}</ul></div>`
    : "<div>No additional evidence types suggested.</div>";
  return `  <div class="enrich">
    <div><strong>AI enrichment</strong><span class="src">source: ${esc(sourceLabel)}</span></div>
    <div>classification: <span class="tag">${esc(en.classification)}</span></div>
    <div>${esc(en.failure_summary)}</div>
    ${suggestedBlock}
  </div>`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
