/**
 * input.test.ts — read scope 厳守 unit test
 *
 * isInReadScope が ALLOW_READ_PREFIXES 外のパスを reject することを確認する。
 */

import { describe, it, expect } from "vitest";
import { isInReadScope } from "../src/input.js";

const SHARED_OPS = "C:/Users/jk023/.shared-ops";

describe("isInReadScope", () => {
  // --- ALLOW cases ---

  it("ALLOW: kai_owner_digest.md は read scope 内", () => {
    expect(isInReadScope(`${SHARED_OPS}/status/kai_owner_digest.md`)).toBe(true);
  });

  it("ALLOW: kai_status.md は read scope 内", () => {
    expect(isInReadScope(`${SHARED_OPS}/status/kai_status.md`)).toBe(true);
  });

  it("ALLOW: zen_status.md は read scope 内", () => {
    expect(isInReadScope(`${SHARED_OPS}/status/zen_status.md`)).toBe(true);
  });

  it("ALLOW: board ファイルは read scope 内", () => {
    expect(
      isInReadScope(
        `${SHARED_OPS}/board/2026-04-29_zen_aira_kai_phase0_design_update_per_kai_stance.md`
      )
    ).toBe(true);
  });

  it("ALLOW: inbox ファイルは read scope 内", () => {
    expect(
      isInReadScope(
        `${SHARED_OPS}/inbox/2026-04-29_zen_kura_5may_revenue_target_estimate_v01.md`
      )
    ).toBe(true);
  });

  // --- DENY cases ---

  it("DENY: WSD 内部ファイルは read scope 外", () => {
    expect(
      isInReadScope(
        "C:/Users/jk023/Desktop/Weekly Signal Desk/leads.json"
      )
    ).toBe(false);
  });

  it("DENY: project-nia ファイルは read scope 外", () => {
    expect(
      isInReadScope("C:/Users/jk023/Desktop/project-nia/src/identity.md")
    ).toBe(false);
  });

  it("DENY: nexus-lab team_memory は read scope 外 (board/inbox 経由のみ)", () => {
    // team_memory への direct read は Aira 禁止 (Kai/Zen board/status 経由を使う)
    expect(
      isInReadScope("C:/Users/jk023/nexus-lab/team_memory/zen/identity.md")
    ).toBe(false);
  });

  it("DENY: shared-ops/_daemon は read scope 外", () => {
    expect(
      isInReadScope(`${SHARED_OPS}/_daemon/zen_identity.sha256`)
    ).toBe(false);
  });

  it("DENY: 空文字は read scope 外", () => {
    expect(isInReadScope("")).toBe(false);
  });

  it("DENY: arbitrary path は read scope 外", () => {
    expect(isInReadScope("C:/Windows/System32/something.txt")).toBe(false);
  });
});
