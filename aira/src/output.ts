/**
 * output.ts — Aira digest output 生成
 *
 * Aira Phase 0 output scope (Kai recommend 厳守):
 *   - digest: 1-2 行 / domain、jun review 工数圧縮
 *   - contradiction_note: Red/Yellow/Green severity 付与
 *   - wait_observation: 出力なし選択あり、識別
 *
 * Aira は outbound send / price 判定 / contract 決定 を行わない (#10 scope creep)
 */

import { auditOutput } from "./boundary.js";

export type Severity = "Red" | "Yellow" | "Green";

export interface DigestEntry {
  domain: string;
  summary: string; // 1-2 行
}

export interface ContradictionNote {
  severity: Severity;
  description: string;
  source: string;
}

export interface WaitObservation {
  topic: string;
  reason: string;
  /** Aira が出力を保留した場合 true */
  withheld: boolean;
}

export interface AiraDigest {
  date: string;
  version: "phase0_mini";
  digest: DigestEntry[];
  contradictions: ContradictionNote[];
  waitObservations: WaitObservation[];
  meta: {
    generatedAt: string;
    dryRun: boolean;
    boundaryAuditPassed: boolean;
    boundaryViolations: string[];
  };
}

/**
 * Markdown 形式の digest ファイルを生成する
 */
export function renderDigestMarkdown(digest: AiraDigest): string {
  const lines: string[] = [];

  lines.push(`# Aira Digest — ${digest.date}`);
  lines.push("");
  lines.push(
    `> Phase 0 mini / ${digest.meta.dryRun ? "DRY RUN" : "LIVE"} / generated ${digest.meta.generatedAt}`
  );
  lines.push("");

  // --- Digest ---
  lines.push("## Digest");
  lines.push("");
  if (digest.digest.length === 0) {
    lines.push("(no entries)");
  } else {
    for (const entry of digest.digest) {
      lines.push(`**${entry.domain}**: ${entry.summary}`);
    }
  }
  lines.push("");

  // --- Contradiction Notes ---
  lines.push("## Contradiction Notes");
  lines.push("");
  if (digest.contradictions.length === 0) {
    lines.push("(none observed)");
  } else {
    for (const note of digest.contradictions) {
      const badge =
        note.severity === "Red"
          ? "🔴"
          : note.severity === "Yellow"
          ? "🟡"
          : "🟢";
      lines.push(`${badge} **${note.severity}** — ${note.description}`);
      lines.push(`  source: ${note.source}`);
    }
  }
  lines.push("");

  // --- WAIT Observations ---
  lines.push("## WAIT Observations");
  lines.push("");
  const relevantWaits = digest.waitObservations.filter(
    (w) => !w.withheld
  );
  const withheld = digest.waitObservations.filter((w) => w.withheld);

  if (relevantWaits.length === 0 && withheld.length === 0) {
    lines.push("(no WAIT observations)");
  } else {
    for (const obs of relevantWaits) {
      lines.push(`- **${obs.topic}**: ${obs.reason}`);
    }
    if (withheld.length > 0) {
      lines.push("");
      lines.push(
        `*(${withheld.length} observation(s) withheld — insufficient signal)*`
      );
    }
  }
  lines.push("");

  // --- Meta ---
  lines.push("## Meta");
  lines.push("");
  lines.push(`- boundary_audit_passed: ${digest.meta.boundaryAuditPassed}`);
  if (digest.meta.boundaryViolations.length > 0) {
    lines.push("- boundary_violations:");
    for (const v of digest.meta.boundaryViolations) {
      lines.push(`  - ${v}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

/**
 * 出力前に boundary audit を実行して digest を確定する
 * (digest.ts から呼ばれる)
 */
export function finalizeDigest(
  digest: Omit<AiraDigest, "meta"> & { dryRun: boolean }
): AiraDigest {
  const fullText = [
    ...digest.digest.map((e) => e.summary),
    ...digest.contradictions.map((c) => c.description),
    ...digest.waitObservations.map((w) => w.reason),
  ].join(" ");

  const audit = auditOutput({
    text: fullText,
    surface: "internal_board",
    requestedAction: "digest",
    outputType: "digest",
  });

  return {
    ...digest,
    meta: {
      generatedAt: new Date().toISOString(),
      dryRun: digest.dryRun,
      boundaryAuditPassed: audit.passed,
      boundaryViolations: audit.violations,
    },
  };
}
