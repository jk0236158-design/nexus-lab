/**
 * boundary.test.ts — Aira identity 監視対象 #9-11 物理ガード unit test
 *
 * 各監視対象に ALLOW + DENY case を用意。
 * `vitest run` で実行。
 */

import { describe, it, expect } from "vitest";
import {
  checkNamingSplit,
  checkScopeCreep,
  checkSecretaryOverlap,
  auditOutput,
  isAllowedOutputType,
  ALLOWED_OUTPUT_TYPES,
} from "../src/boundary.js";

// =============================================================================
// #9 Naming Split Drift
// =============================================================================

describe("#9 naming split drift", () => {
  // --- ALLOW cases ---

  it("ALLOW: internal board surface は Aira 識別子を含んでもOK", () => {
    const result = checkNamingSplit(
      "Aira Phase 0 mini implementation complete",
      "internal_board"
    );
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: team_memory への書き込みは internal surface", () => {
    const result = checkNamingSplit(
      "Aira digest output shipped",
      "team_memory_iwa_note"
    );
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: Zenn 記事で Aira 識別子なし", () => {
    const result = checkNamingSplit(
      "nokaze では AI が自律的に digest を生成しています",
      "zenn"
    );
    expect(result.allowed).toBe(true);
  });

  // --- DENY cases ---

  it("DENY: Zenn 記事で 'Aira' 漏出", () => {
    const result = checkNamingSplit(
      "Aira という内部 AI が毎日 digest を生成しています",
      "zenn"
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/#9 naming split drift/);
      expect(result.violation).toBe("Aira");
    }
  });

  it("DENY: README で 'Aira' 漏出", () => {
    const result = checkNamingSplit(
      "Powered by Aira — internal digest AI",
      "README"
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.violation).toBe("Aira");
    }
  });

  it("DENY: npm description で 'aira' (lowercase) 漏出", () => {
    const result = checkNamingSplit(
      "aira digest integration for nokaze",
      "npm_description"
    );
    // npm_description は PUBLIC_SURFACE_MARKERS に含まれないので internal 扱い → ALLOW
    // (PUBLIC_SURFACE_MARKERS: "npm" が含まれる場合は DENY)
    const result2 = checkNamingSplit(
      "aira digest integration for nokaze",
      "npm"
    );
    expect(result2.allowed).toBe(false);
  });

  it("DENY: gumroad 商品 description で 'AIRA' 漏出", () => {
    const result = checkNamingSplit(
      "This product is powered by AIRA, our internal AI",
      "gumroad"
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.violation).toBe("AIRA");
    }
  });
});

// =============================================================================
// #10 Scope Creep
// =============================================================================

describe("#10 scope creep", () => {
  // --- ALLOW cases ---

  it("ALLOW: digest アクションは Phase 0 許可範囲", () => {
    const result = checkScopeCreep("digest");
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: contradiction_note アクション", () => {
    const result = checkScopeCreep("contradiction_note");
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: wait_observation アクション", () => {
    const result = checkScopeCreep("wait_observation");
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: read_status アクション", () => {
    const result = checkScopeCreep("read_status");
    expect(result.allowed).toBe(true);
  });

  // --- DENY cases ---

  it("DENY: send_email アクション", () => {
    const result = checkScopeCreep("send_email");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/#10 scope creep/);
      expect(result.action).toBe("send_email");
    }
  });

  it("DENY: change_price アクション", () => {
    const result = checkScopeCreep("change_price");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.action).toBe("change_price");
    }
  });

  it("DENY: contact_lead アクション", () => {
    const result = checkScopeCreep("contact_lead");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.action).toBe("contact_lead");
    }
  });

  it("DENY: mark_packet_sent アクション", () => {
    const result = checkScopeCreep("mark_packet_sent");
    expect(result.allowed).toBe(false);
  });

  it("DENY: mutate_wsd_state アクション", () => {
    const result = checkScopeCreep("mutate_wsd_state");
    expect(result.allowed).toBe(false);
  });

  it("DENY: approve_contract アクション", () => {
    const result = checkScopeCreep("approve_contract");
    expect(result.allowed).toBe(false);
  });
});

describe("#10 isAllowedOutputType", () => {
  it("ALLOW: 'digest' は allowed output type", () => {
    expect(isAllowedOutputType("digest")).toBe(true);
  });

  it("ALLOW: 'contradiction_note' は allowed output type", () => {
    expect(isAllowedOutputType("contradiction_note")).toBe(true);
  });

  it("ALLOW: 'wait_observation' は allowed output type", () => {
    expect(isAllowedOutputType("wait_observation")).toBe(true);
  });

  it("DENY: 'email_draft' は allowed output type でない", () => {
    expect(isAllowedOutputType("email_draft")).toBe(false);
  });

  it("DENY: 'pricing_update' は allowed output type でない", () => {
    expect(isAllowedOutputType("pricing_update")).toBe(false);
  });

  it("DENY: 'action_plan' は allowed output type でない", () => {
    expect(isAllowedOutputType("action_plan")).toBe(false);
  });
});

// =============================================================================
// #11 Secretary Overlap
// =============================================================================

describe("#11 secretary overlap", () => {
  // --- ALLOW cases ---

  it("ALLOW: 通常の digest 出力は secretary overlap なし", () => {
    const result = checkSecretaryOverlap(
      "WSD: leads 28, reply wait 14. Nexus Lab: Wave 1 開始。"
    );
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: contradiction note は secretary overlap なし", () => {
    const result = checkSecretaryOverlap(
      "¥15,000 目標の先延ばし shift、inbox re-position 済。Yellow severity。"
    );
    expect(result.allowed).toBe(true);
  });

  it("ALLOW: WAIT observation は secretary overlap なし", () => {
    const result = checkSecretaryOverlap(
      "Gemini API key 設定が必要。jun 物理 action: ~/.secrets/aira.env に設定。"
    );
    expect(result.allowed).toBe(true);
  });

  // --- DENY cases ---

  it("DENY: 'schedule meeting' pattern", () => {
    const result = checkSecretaryOverlap(
      "I will schedule a meeting with the team for tomorrow."
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/#11 secretary overlap/);
    }
  });

  it("DENY: 'send on behalf' pattern", () => {
    const result = checkSecretaryOverlap(
      "Aira will send the email on behalf of Jun."
    );
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toMatch(/#11 secretary overlap/);
    }
  });

  it("DENY: 'manage calendar' pattern", () => {
    const result = checkSecretaryOverlap(
      "Aira can manage your calendar for this week."
    );
    expect(result.allowed).toBe(false);
  });
});

// =============================================================================
// composite audit
// =============================================================================

describe("auditOutput composite", () => {
  it("PASS: internal board, digest action, clean text", () => {
    const result = auditOutput({
      text: "WSD leads 28, Nexus Lab Wave 1 開始。",
      surface: "internal_board",
      requestedAction: "digest",
      outputType: "digest",
    });
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("FAIL: public surface (zenn) + Aira identifier + scope creep action", () => {
    const result = auditOutput({
      text: "Aira が毎日 digest を生成し、email を送信します。",
      surface: "zenn",
      requestedAction: "send_email",
      outputType: "email_draft",
    });
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
    // #9 naming split + #10 scope creep (send_email + outputType) が出るはず
    expect(result.violations.some((v) => v.includes("#9"))).toBe(true);
    expect(result.violations.some((v) => v.includes("#10"))).toBe(true);
  });

  it("FAIL: secretary overlap in digest text", () => {
    const result = auditOutput({
      text: "I will schedule a meeting with jun next week.",
      surface: "internal_board",
      requestedAction: "digest",
      outputType: "digest",
    });
    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.includes("#11"))).toBe(true);
  });
});
