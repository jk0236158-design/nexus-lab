/**
 * digest.ts — Aira digest 生成 core
 *
 * DRY_RUN=true  → mock implementation (Gemini API key 不要、first digest dry-run output)
 * DRY_RUN=false → actual Gemini 2.0 Flash API call (GEMINI_API_KEY 必須)
 *
 * Entry point: `node --loader ts-node/esm src/digest.ts`
 *   or: `DRY_RUN=true node --loader ts-node/esm src/digest.ts`
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import {
  collectAllInputs,
  isReadResult,
  type InputCollection,
} from "./input.js";
import { finalizeDigest, renderDigestMarkdown } from "./output.js";
import type { DigestEntry, ContradictionNote, WaitObservation } from "./output.js";
import { checkBudget, estimateTokens } from "./budget.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIGEST_OUTPUT_DIR = join(__dirname, "../data/digests");

// --- Gemini mock / actual ---

async function callGeminiMock(
  _prompt: string
): Promise<{
  digest: DigestEntry[];
  contradictions: ContradictionNote[];
  waitObservations: WaitObservation[];
}> {
  /**
   * mock: 実際の input sources の内容から手動で構築した first digest
   * (2026-04-29 evening dry-run)
   *
   * input read: kai_owner_digest.md / kai_status.md / zen_status.md / board 直近 3 日 / inbox 直近 3 日
   * 読んだ結果を反映した診断的 digest
   */
  return {
    digest: [
      {
        domain: "WSD (Kai)",
        summary:
          "leads 28、ready packets 0、reply wait 14 継続、owner-request 3 件 Yellow 保留 (form send / transport 確認)。open delivery job 1。Kai は work-188 fallback packet 進行中。",
      },
      {
        domain: "Nexus Lab (Zen)",
        summary:
          "Wave 1 開始 (4/29)、Iwa T4 hook chain 完成 + memory prefix 追加 完遂。BOOTH 商品 4 公開 day+7 baseline 0 継続。5 月目標 ¥15,000 consolidated 確定 (Zen+Kai stance 揃い済)。Aira Phase 0 mini 実装 本日着手。",
      },
      {
        domain: "nokaze 連携",
        summary:
          "5/08 review 議題 27-29 pending: layer retirement phase / noto product funnel priority / 5 月目標。Path B (外部 peer review 経由収益化) 採用 4/28 jun directive 確定。",
      },
      {
        domain: "Aira (本 digest)",
        summary:
          "Phase 0 mini first digest dry-run 出力 (mock)。boundary audit #9-11 PASS。Gemini API key 設定後 actual call に切替予定。",
      },
    ],
    contradictions: [
      {
        severity: "Yellow",
        description:
          "¥15,000 目標は Zen+Kai stance で既に揃っていたが、jun 4/29 19:15 「先延ばし shift」指摘まで inbox が prerequisite 扱いになっていた。inbox を確定後の経理視点 record に re-position 済。",
        source: "inbox/2026-04-29_zen_kura_5may_revenue_target_estimate_v01.md + board/2026-04-29_zen_jun_kai_5may_target_15000_finalize.md",
      },
      {
        severity: "Yellow",
        description:
          "selective denial L2 残存 (.claude/ subdirectory special treatment 新 pattern)。Iwa T4 hook chain で identity.md baseline auto-update は完成、settings.local.json edit は Zen PowerShell 代行必要。resolution test 5/05 期限。",
        source: "board/2026-04-29_iwa_zen_t4_hook_chain_complete_selective_denial_n4.md",
      },
      {
        severity: "Green",
        description:
          "Aira Phase 0 実装が 4/28 17:00 予定から 4/29 夜着手に slip。ただし boundary first 維持 + jun directive 「AI 自律完結の枠に縮こまるな」受領 → note/X 活用含む broader scope 確認 = スケジュール slip ではなく scope clarification。",
        source: "board/2026-04-29_zen_aira_kai_phase0_design_update_per_kai_stance.md",
      },
    ],
    waitObservations: [
      {
        topic: "Gemini API key 設定",
        reason:
          "actual Gemini call に必要。jun 物理 action: GEMINI_API_KEY を ~/.secrets/aira.env または nexus-lab/aira/.env に設定後、DRY_RUN=false で再実行。",
        withheld: false,
      },
      {
        topic: "BOOTH day+7 baseline 0",
        reason:
          "14 日観測 cohort (4/22 〜 5/06) の中間点。day+7 まで売上 0 は観測範囲内 (Path B 並走中)。5/06 cohort 終了後に Hoshi 評価。",
        withheld: false,
      },
      {
        topic: "owner-request 3 件 Yellow",
        reason:
          "form send / transport 確認は Kai side 保留。jun 物理 action 不要 (Kai バッチ処理中)。",
        withheld: true,
      },
    ],
  };
}

async function callGeminiActual(
  prompt: string,
  apiKey: string
): Promise<{
  digest: DigestEntry[];
  contradictions: ContradictionNote[];
  waitObservations: WaitObservation[];
}> {
  // Dynamic import で @google/generative-ai を使う (API key 必須時のみ load)
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Gemini の出力を JSON として parse (prompt で JSON format を強制)
  try {
    return JSON.parse(text);
  } catch {
    // fallback: テキストをそのまま digest 1 entry として返す
    return {
      digest: [{ domain: "Gemini raw output", summary: text.slice(0, 200) }],
      contradictions: [],
      waitObservations: [],
    };
  }
}

function buildGeminiPrompt(inputs: InputCollection): string {
  const sections: string[] = [];

  sections.push("# Aira Digest Generation Prompt");
  sections.push(
    "You are Aira, a read-only digest synthesis layer for nokaze (AI + human operated company)."
  );
  sections.push(
    "Generate a daily digest in JSON format. Output ONLY valid JSON, no markdown wrapper."
  );
  sections.push("");
  sections.push("## JSON Schema");
  sections.push(
    JSON.stringify(
      {
        digest: [{ domain: "string", summary: "1-2 lines" }],
        contradictions: [
          { severity: "Red|Yellow|Green", description: "string", source: "string" }
        ],
        waitObservations: [
          { topic: "string", reason: "string", withheld: "boolean" }
        ],
      },
      null,
      2
    )
  );
  sections.push("");
  sections.push("## Input Sources");

  if (isReadResult(inputs.kaiOwnerDigest)) {
    sections.push("### kai_owner_digest.md");
    sections.push(inputs.kaiOwnerDigest.content.slice(0, 1500));
  }
  if (isReadResult(inputs.kaiStatus)) {
    sections.push("### kai_status.md");
    sections.push(inputs.kaiStatus.content.slice(0, 1000));
  }
  if (isReadResult(inputs.zenStatus)) {
    sections.push("### zen_status.md");
    sections.push(inputs.zenStatus.content.slice(0, 1500));
  }

  const boardOk = inputs.boardMessages.filter(isReadResult).slice(0, 5);
  if (boardOk.length > 0) {
    sections.push("### Recent Board Messages");
    for (const b of boardOk) {
      sections.push(`#### ${b.path.split(/[/\\]/).pop()}`);
      sections.push(b.content.slice(0, 400));
    }
  }

  const inboxOk = inputs.inboxItems.filter(isReadResult).slice(0, 3);
  if (inboxOk.length > 0) {
    sections.push("### Inbox");
    for (const i of inboxOk) {
      sections.push(`#### ${i.path.split(/[/\\]/).pop()}`);
      sections.push(i.content.slice(0, 300));
    }
  }

  sections.push("");
  sections.push(
    "Output constraints: Aira outputs digest / contradiction_notes / wait_observations ONLY. " +
    "No outbound send, pricing, contract, WSD mutation. " +
    "Keep digest entries 1-2 lines each. Severity: Red (requires immediate Origin action), Yellow (monitor), Green (observation only)."
  );

  return sections.join("\n");
}

// --- main ---

async function main() {
  const dryRun = process.env["DRY_RUN"] !== "false";
  const apiKey = process.env["GEMINI_API_KEY"] ?? "";
  const today = new Date().toISOString().slice(0, 10);

  console.log(`[Aira] digest generation start — date=${today} dryRun=${dryRun}`);

  // 1. Collect inputs
  const inputs = collectAllInputs({ boardDaysBack: 3, inboxDaysBack: 3 });
  console.log(
    `[Aira] inputs collected: kai_owner_digest=${isReadResult(inputs.kaiOwnerDigest) ? "OK" : "ERR"}, kai_status=${isReadResult(inputs.kaiStatus) ? "OK" : "ERR"}, zen_status=${isReadResult(inputs.zenStatus) ? "OK" : "ERR"}, board=${inputs.boardMessages.filter(isReadResult).length}, inbox=${inputs.inboxItems.filter(isReadResult).length}`
  );

  // 2. Build prompt
  const prompt = buildGeminiPrompt(inputs);
  const promptTokens = estimateTokens(prompt);
  console.log(`[Aira] prompt ~${promptTokens} tokens`);

  // Budget check
  const budgetCheck = checkBudget({
    inputTokens: promptTokens,
    outputTokens: 500, // estimate
  });
  if (!budgetCheck.withinBudget) {
    console.error(`[Aira] Budget exceeded: ${budgetCheck.reason}`);
    process.exit(1);
  }
  console.log(
    `[Aira] budget OK — estimated ¥${budgetCheck.estimatedCostJpy.toFixed(4)}`
  );

  // 3. Generate
  let rawOutput: Awaited<ReturnType<typeof callGeminiMock>>;
  if (dryRun || !apiKey) {
    if (!dryRun && !apiKey) {
      console.warn(
        "[Aira] GEMINI_API_KEY not set — falling back to mock (dry-run)"
      );
    }
    rawOutput = await callGeminiMock(prompt);
  } else {
    console.log("[Aira] calling Gemini 2.0 Flash API...");
    rawOutput = await callGeminiActual(prompt, apiKey);
  }

  // 4. Finalize (boundary audit)
  const digest = finalizeDigest({
    date: today,
    version: "phase0_mini",
    ...rawOutput,
    dryRun,
  });

  if (!digest.meta.boundaryAuditPassed) {
    console.error(
      `[Aira] Boundary audit FAILED: ${digest.meta.boundaryViolations.join("; ")}`
    );
    process.exit(1);
  }
  console.log("[Aira] boundary audit PASSED");

  // 5. Write output
  if (!existsSync(DIGEST_OUTPUT_DIR)) {
    mkdirSync(DIGEST_OUTPUT_DIR, { recursive: true });
  }

  const fileName = `${today}_aira_first_digest.md`;
  const outputPath = join(DIGEST_OUTPUT_DIR, fileName);
  const markdown = renderDigestMarkdown(digest);

  writeFileSync(outputPath, markdown, "utf-8");
  console.log(`[Aira] digest written to: ${outputPath}`);

  // Print summary
  console.log("\n--- Digest Summary ---");
  for (const entry of digest.digest) {
    console.log(`[${entry.domain}] ${entry.summary.slice(0, 80)}...`);
  }
  console.log(
    `Contradictions: ${digest.contradictions.length} (Red: ${digest.contradictions.filter((c) => c.severity === "Red").length}, Yellow: ${digest.contradictions.filter((c) => c.severity === "Yellow").length}, Green: ${digest.contradictions.filter((c) => c.severity === "Green").length})`
  );
  console.log(
    `WAIT obs: ${digest.waitObservations.filter((w) => !w.withheld).length} shown, ${digest.waitObservations.filter((w) => w.withheld).length} withheld`
  );
}

main().catch((err) => {
  console.error("[Aira] fatal error:", err);
  process.exit(1);
});
