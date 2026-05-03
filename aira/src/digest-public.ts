/**
 * digest-public.ts — 商品化版 digest pipeline (yuino)
 *
 * 5/03 evening 起稿 (Iwa packet integration、Zen 直筆 implement)
 *
 * 既存 digest.ts は Phase 0 mini main entry + nokaze-specific (DRY_RUN env + hard-coded paths)。
 * 本 file は商品化版 library form、cli/digest.ts から config 経由で invoke される。
 *
 * Pipeline:
 *   1. ingestAllScopes(config.observer_scopes) → IngestOutcome[]
 *   2. buildPrompt (domains + ingested content)
 *   3. callGemini (config.gemini.model / api_key / budget)
 *   4. parse Gemini output → digest entries / contradictions / wait observations
 *   5. auditOutput (config.boundary)
 *   6. renderDigest (markdown)
 *   7. writeToDestinations (config.digest.output)
 */

import type { Config } from './config.js';
import { ingestAllScopes, isIngestResult, type IngestOutcome, type IngestSummary } from './input-public.js';
import { auditOutput, type BoundaryAuditResult, type BoundaryViolation } from './boundary-public.js';
import { writeToDestinations, getOutputPaths, type OutputOutcome } from './output-public.js';

// === Digest data model (商品化版) ===

export interface DigestEntry {
  domain: string;
  summary: string;
}

export interface ContradictionNote {
  severity: 'Red' | 'Yellow' | 'Green';
  description: string;
  source?: string;
}

export interface WaitObservation {
  topic: string;
  reason: string;
  withheld?: boolean;
}

export interface RawDigestOutput {
  digest: DigestEntry[];
  contradictions: ContradictionNote[];
  waitObservations: WaitObservation[];
}

// === Pipeline result ===

export interface GenerateDigestResult {
  ok: true;
  outputPaths: string[];
  output_outcomes: OutputOutcome[];
  boundary_violations: BoundaryViolation[];
  ingest_summary: IngestSummary;
  digest_preview: string;
  api_called: boolean;
  api_cost_usd?: number;
}

export interface GenerateDigestError {
  ok: false;
  error: string;
  stage: 'ingest' | 'gemini' | 'boundary' | 'output' | 'unknown';
  detail?: string;
}

export type GenerateDigestOutcome = GenerateDigestResult | GenerateDigestError;

// === Mock digest (DRY RUN、API key なし時の fallback) ===

function generateMockDigest(domains: string[], ingestSummary: IngestSummary): RawDigestOutput {
  const date = new Date().toISOString().slice(0, 10);
  return {
    digest: domains.map((d, i) => ({
      domain: d,
      summary: `(DRY RUN mock summary for "${d}", ${ingestSummary.total_files_read} files ingested)`,
    })),
    contradictions: [
      {
        severity: 'Yellow',
        description: '(DRY RUN mock) actual digest generation requires GEMINI_API_KEY env var to be set',
        source: 'config.gemini.api_key_env',
      },
    ],
    waitObservations: [
      {
        topic: 'Set Gemini API key',
        reason: `Configure ${date} digest run by setting env var (default: GEMINI_API_KEY) and re-run`,
        withheld: false,
      },
    ],
  };
}

// === Build Gemini prompt ===

function buildGeminiPrompt(
  domains: string[],
  outcomes: IngestOutcome[],
  contradictionLevels: ('yellow' | 'green' | 'red')[],
): string {
  const sections: string[] = [];

  sections.push('# Yuino Digest Generation');
  sections.push('You are Yuino, an owner-digest synthesis layer for 1-owner-multi-AI organizations.');
  sections.push('Generate a daily digest in JSON format. Output ONLY valid JSON, no markdown wrapper.');
  sections.push('');

  sections.push('## JSON Schema');
  sections.push(
    JSON.stringify(
      {
        digest: [{ domain: 'string (one of configured domains)', summary: '1-2 sentences' }],
        contradictions: [
          {
            severity: `"Red" | "Yellow" | "Green"`,
            description: 'string',
            source: 'optional file path / record reference',
          },
        ],
        waitObservations: [
          {
            topic: 'string',
            reason: 'why human action is needed',
            withheld: 'optional boolean (true to suppress from output)',
          },
        ],
      },
      null,
      2,
    ),
  );

  sections.push('');
  sections.push('## Configured Domains');
  for (const d of domains) {
    sections.push(`- ${d}`);
  }

  sections.push('');
  sections.push('## Severity Levels Allowed');
  for (const lvl of contradictionLevels) {
    sections.push(`- ${lvl} (capitalize first letter in output: ${lvl.charAt(0).toUpperCase() + lvl.slice(1)})`);
  }

  sections.push('');
  sections.push('## Ingested Sources (Raw)');

  const successful = outcomes.filter(isIngestResult);
  for (const o of successful.slice(0, 30)) {
    // Cap each file content to 800 chars to keep prompt within budget
    const trimmed = o.content.length > 800 ? o.content.slice(0, 800) + '\n...(truncated)' : o.content;
    sections.push(`### scope=${o.scope_id} path=${o.path}`);
    sections.push(trimmed);
    sections.push('');
  }

  sections.push('---');
  sections.push('Output constraints:');
  sections.push('- digest entries: keep to 1-2 sentences each');
  sections.push('- contradictions: cite source path when possible');
  sections.push('- wait observations: surface human action items only');
  sections.push('- output JSON only, no preamble, no markdown wrapper');

  return sections.join('\n');
}

// === Token estimation (rough) ===

function estimateTokens(text: string): number {
  // Conservative: 1 token ≈ 3 chars for English/Japanese mix
  return Math.ceil(text.length / 3);
}

// === Gemini API call (β scope) ===

async function callGemini(
  prompt: string,
  config: Config['gemini'],
): Promise<{ output: RawDigestOutput; cost_usd: number }> {
  const apiKey = process.env[config.api_key_env];
  if (!apiKey) {
    throw new Error(
      `Gemini API key env var "${config.api_key_env}" is not set`,
    );
  }

  // Budget check (estimated)
  const promptTokens = estimateTokens(prompt);
  const estimatedOutputTokens = 1500;
  // gemini-1.5-flash pricing (rough): $0.075/1M input + $0.30/1M output
  const estimatedCost =
    (promptTokens / 1_000_000) * 0.075 + (estimatedOutputTokens / 1_000_000) * 0.3;
  if (estimatedCost > config.budget_per_digest_usd) {
    throw new Error(
      `Estimated cost $${estimatedCost.toFixed(4)} exceeds budget $${config.budget_per_digest_usd.toFixed(4)}`,
    );
  }

  // Dynamic import (avoid loading @google/generative-ai unless needed)
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: config.model });

  // Retry logic (β scope: simple)
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= config.max_retries; attempt += 1) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), config.timeout_seconds * 1000),
        ),
      ]);

      const text = (result as Awaited<ReturnType<typeof model.generateContent>>).response.text();

      // Parse JSON (with fallback)
      let parsed: RawDigestOutput;
      try {
        // Strip markdown code fences if Gemini wraps in them despite instructions
        const cleaned = text.replace(/^```json\n/i, '').replace(/^```\n/i, '').replace(/\n```$/, '');
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: wrap raw text as single digest entry
        parsed = {
          digest: [{ domain: 'gemini_raw_output', summary: text.slice(0, 300) }],
          contradictions: [],
          waitObservations: [],
        };
      }

      return { output: parsed, cost_usd: estimatedCost };
    } catch (err) {
      lastErr = err as Error;
      if (attempt < config.max_retries) {
        // Brief backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  throw new Error(`Gemini API failed after ${config.max_retries + 1} attempts: ${lastErr?.message}`);
}

// === Render digest markdown ===

function renderDigest(
  date: string,
  raw: RawDigestOutput,
  audit: BoundaryAuditResult,
  ingestSummary: IngestSummary,
  contradictionLevels: ('yellow' | 'green' | 'red')[],
  showWaitObservations: boolean,
  apiCalled: boolean,
): string {
  const lines: string[] = [];
  lines.push(`# Yuino Digest — ${date}`);
  lines.push('');
  lines.push(`> Generated ${new Date().toISOString()}${apiCalled ? ' (LIVE)' : ' (DRY RUN, mock)'}`);
  lines.push('');

  lines.push('## Digest');
  lines.push('');
  for (const entry of raw.digest) {
    lines.push(`**${entry.domain}**: ${entry.summary}`);
  }
  lines.push('');

  // Filter contradictions by configured levels
  const allowedSeverities = new Set(contradictionLevels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)));
  const visibleContradictions = raw.contradictions.filter((c) => allowedSeverities.has(c.severity));
  if (visibleContradictions.length > 0) {
    lines.push('## Contradiction Notes');
    lines.push('');
    for (const c of visibleContradictions) {
      const icon = c.severity === 'Red' ? '🔴' : c.severity === 'Yellow' ? '🟡' : '🟢';
      lines.push(`${icon} **${c.severity}** — ${c.description}`);
      if (c.source) lines.push(`  source: ${c.source}`);
    }
    lines.push('');
  }

  if (showWaitObservations) {
    const visibleWaits = raw.waitObservations.filter((w) => !w.withheld);
    const withheldCount = raw.waitObservations.length - visibleWaits.length;
    if (visibleWaits.length > 0) {
      lines.push('## WAIT Observations');
      lines.push('');
      for (const w of visibleWaits) {
        lines.push(`- **${w.topic}**: ${w.reason}`);
      }
      if (withheldCount > 0) {
        lines.push('');
        lines.push(`*(${withheldCount} observation(s) withheld — insufficient signal)*`);
      }
      lines.push('');
    }
  }

  lines.push('## Boundary Audit');
  lines.push('');
  if (audit.passed) {
    lines.push('- result: PASS ✓');
  } else {
    lines.push(`- result: FAIL — ${audit.blocked.length} blocked, ${audit.warnings.length} warnings, ${audit.logged.length} logged`);
    if (audit.blocked.length > 0) {
      lines.push('');
      lines.push('### Blocked');
      for (const v of audit.blocked) {
        lines.push(`- 🔴 [${v.rule_id}] ${v.message}`);
      }
    }
    if (audit.warnings.length > 0) {
      lines.push('');
      lines.push('### Warnings');
      for (const v of audit.warnings) {
        lines.push(`- 🟡 [${v.rule_id}] ${v.message}`);
      }
    }
  }
  lines.push('');

  lines.push('## Meta');
  lines.push('');
  lines.push(`- ingest: ${ingestSummary.total_files_read} files (${ingestSummary.total_bytes_read} bytes)`);
  lines.push(`- ingest errors: ${ingestSummary.total_files_failed}`);
  lines.push(`- api_called: ${apiCalled}`);
  lines.push(`- boundary_audit_passed: ${audit.passed}`);

  return lines.join('\n');
}

// === Main pipeline (library form) ===

export async function generateDigest(
  config: Config,
  opts: { dryRun?: boolean } = {},
): Promise<GenerateDigestOutcome> {
  const date = new Date().toISOString().slice(0, 10);

  // 1. Ingest
  let ingestOutcomes: IngestOutcome[];
  let ingestSummary: IngestSummary;
  try {
    const result = await ingestAllScopes(config.observer_scopes);
    ingestOutcomes = result.outcomes;
    ingestSummary = result.summary;
  } catch (err) {
    return { ok: false, error: 'Ingest failed', stage: 'ingest', detail: (err as Error).message };
  }

  if (ingestSummary.total_files_read === 0) {
    return {
      ok: false,
      error: 'No files ingested from any observer scope. Check paths and glob patterns.',
      stage: 'ingest',
    };
  }

  // 2. Build prompt
  const contradictionLevels = config.contradiction_notes.enabled
    ? config.contradiction_notes.levels
    : [];
  const prompt = buildGeminiPrompt(config.digest.domains, ingestOutcomes, contradictionLevels);

  // 3. Call Gemini (or mock)
  let raw: RawDigestOutput;
  let api_cost_usd: number | undefined;
  let api_called = false;
  if (opts.dryRun) {
    raw = generateMockDigest(config.digest.domains, ingestSummary);
  } else {
    try {
      const geminiResult = await callGemini(prompt, config.gemini);
      raw = geminiResult.output;
      api_cost_usd = geminiResult.cost_usd;
      api_called = true;
    } catch (err) {
      // Fallback to mock if Gemini fails (with reason)
      const errMessage = (err as Error).message;
      raw = generateMockDigest(config.digest.domains, ingestSummary);
      raw.contradictions.unshift({
        severity: 'Yellow',
        description: `Gemini API call failed, falling back to mock: ${errMessage}`,
        source: 'gemini.config',
      });
    }
  }

  // 4. Boundary audit
  const renderedRaw = JSON.stringify(raw, null, 2);
  const audit = auditOutput(renderedRaw, config.boundary);

  // 5. Render markdown
  const showWait = config.wait_observations.enabled;
  const markdown = renderDigest(
    date,
    raw,
    audit,
    ingestSummary,
    contradictionLevels,
    showWait,
    api_called,
  );

  // 6. Write to destinations
  const writeResult = await writeToDestinations(markdown, config.digest.output, date);
  const outputPaths = getOutputPaths(writeResult.outcomes);

  return {
    ok: true,
    outputPaths,
    output_outcomes: writeResult.outcomes,
    boundary_violations: audit.violations,
    ingest_summary: ingestSummary,
    digest_preview: markdown.slice(0, 500),
    api_called,
    api_cost_usd,
  };
}
