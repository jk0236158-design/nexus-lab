/**
 * templates-integration.test.ts — premium boundary templates 3 件 integration test
 *
 * 5/04 朝起稿 (Iwa packet、Wave 1 期間 return content path)
 *
 * scope:
 *   - templates/boundary/{governance,audit,handoff}.boundary.yml の loader
 *   - resolveBoundaryTemplates の merge precedence
 *   - 各 template の代表 pattern 1-2 個が auditOutput で trigger される
 *   - multi-template 同時 apply (重複 rule_id / 順序)
 *   - 存在しない template name → error
 */

import { describe, it, expect } from "vitest";
import { resolve } from "node:path";
import { loadBoundaryTemplate } from "../src/config-loader.js";
import { resolveBoundaryTemplates, validateConfig } from "../src/config.js";
import { auditOutput } from "../src/boundary-public.js";

const TEMPLATES_DIR = resolve(process.cwd(), "templates", "boundary");

describe("loadBoundaryTemplate (3 premium templates)", () => {
  it("loads governance template with custom_rules", async () => {
    const t = await loadBoundaryTemplate("governance", TEMPLATES_DIR);
    expect(t).not.toBeNull();
    expect(Array.isArray(t!.custom_rules)).toBe(true);
    expect(t!.custom_rules.length).toBeGreaterThan(0);
    const ids = t!.custom_rules.map((r) => r.id);
    expect(ids).toContain("confidential_doc");
    expect(ids).toContain("pii_email");
  });

  it("loads audit template with custom_rules", async () => {
    const t = await loadBoundaryTemplate("audit", TEMPLATES_DIR);
    expect(t).not.toBeNull();
    const ids = t!.custom_rules.map((r) => r.id);
    expect(ids).toContain("payment_action");
    expect(ids).toContain("contract_action");
  });

  it("loads handoff template with custom_rules", async () => {
    const t = await loadBoundaryTemplate("handoff", TEMPLATES_DIR);
    expect(t).not.toBeNull();
    const ids = t!.custom_rules.map((r) => r.id);
    expect(ids).toContain("handoff_pending");
    expect(ids).toContain("stalled_task");
  });

  it("returns null for non-existent template (file not found)", async () => {
    const t = await loadBoundaryTemplate("nonexistent_template_xyz", TEMPLATES_DIR);
    expect(t).toBeNull();
  });
});

describe("resolveBoundaryTemplates merge", () => {
  it("merges single template into custom_rules", async () => {
    const v = validateConfig({
      observer_scopes: [
        { id: "x", type: "file_directory", path: "./", glob: "**/*.md" },
      ],
      boundary: {
        templates: ["governance"],
        custom_rules: [
          { id: "user_custom", pattern: "MYORG", action: "warn", message: "user" },
        ],
      },
      digest: {
        domains: ["X"],
        output: [{ type: "stdout", filename_template: "{date}.md" }],
      },
    });
    expect(v.ok).toBe(true);
    if (!v.ok) return;

    const resolved = await resolveBoundaryTemplates(v.config, (name) =>
      loadBoundaryTemplate(name, TEMPLATES_DIR)
    );

    const ids = resolved.boundary.custom_rules.map((r) => r.id);
    expect(ids).toContain("user_custom");
    expect(ids).toContain("confidential_doc");
    expect(ids).toContain("pii_email");
    expect(resolved.boundary.templates.length).toBe(0);
  });

  it("merges all 3 templates simultaneously", async () => {
    const v = validateConfig({
      observer_scopes: [
        { id: "x", type: "file_directory", path: "./", glob: "**/*.md" },
      ],
      boundary: {
        templates: ["governance", "audit", "handoff"],
      },
      digest: {
        domains: ["X"],
        output: [{ type: "stdout", filename_template: "{date}.md" }],
      },
    });
    if (!v.ok) {
      console.error(v.errors);
      throw new Error("Config validation should succeed");
    }

    const resolved = await resolveBoundaryTemplates(v.config, (name) =>
      loadBoundaryTemplate(name, TEMPLATES_DIR)
    );

    const ids = resolved.boundary.custom_rules.map((r) => r.id);
    expect(ids).toContain("confidential_doc");
    expect(ids).toContain("payment_action");
    expect(ids).toContain("handoff_pending");
  });

  it("preserves user custom_rules ordering before template rules (precedence)", async () => {
    const v = validateConfig({
      observer_scopes: [
        { id: "x", type: "file_directory", path: "./", glob: "**/*.md" },
      ],
      boundary: {
        templates: ["governance"],
        custom_rules: [{ id: "user_first", pattern: "FIRST", action: "deny" }],
      },
      digest: {
        domains: ["X"],
        output: [{ type: "stdout", filename_template: "{date}.md" }],
      },
    });
    if (!v.ok) throw new Error("validate");

    const resolved = await resolveBoundaryTemplates(v.config, (name) =>
      loadBoundaryTemplate(name, TEMPLATES_DIR)
    );
    const ids = resolved.boundary.custom_rules.map((r) => r.id);
    expect(ids[0]).toBe("user_first");
    expect(ids.indexOf("confidential_doc")).toBeGreaterThan(0);
  });

  it("throws when template name does not exist", async () => {
    const v = validateConfig({
      observer_scopes: [
        { id: "x", type: "file_directory", path: "./", glob: "**/*.md" },
      ],
      boundary: { templates: ["nonexistent_template_xyz"] },
      digest: {
        domains: ["X"],
        output: [{ type: "stdout", filename_template: "{date}.md" }],
      },
    });
    if (!v.ok) throw new Error("validate");

    await expect(
      resolveBoundaryTemplates(v.config, (name) =>
        loadBoundaryTemplate(name, TEMPLATES_DIR)
      )
    ).rejects.toThrow(/not found/);
  });
});

describe("auditOutput with merged premium templates", () => {
  async function buildConfigWithTemplates(templates: string[]) {
    const v = validateConfig({
      observer_scopes: [
        { id: "x", type: "file_directory", path: "./", glob: "**/*.md" },
      ],
      boundary: {
        monitor_types: [],
        templates,
      },
      digest: {
        domains: ["X"],
        output: [{ type: "stdout", filename_template: "{date}.md" }],
      },
    });
    if (!v.ok) throw new Error("validate");
    return resolveBoundaryTemplates(v.config, (name) =>
      loadBoundaryTemplate(name, TEMPLATES_DIR)
    );
  }

  it("governance: confidential_doc → action=deny", async () => {
    const config = await buildConfigWithTemplates(["governance"]);
    const result = auditOutput(
      "This document is confidential, do not share.",
      config.boundary
    );
    expect(result.passed).toBe(false);
    expect(result.blocked.some((v) => v.rule_id === "confidential_doc")).toBe(true);
  });

  it("governance: pii_email → action=warn (not blocked)", async () => {
    const config = await buildConfigWithTemplates(["governance"]);
    const result = auditOutput(
      "Contact us at owner@example.com for questions.",
      config.boundary
    );
    expect(result.warnings.some((v) => v.rule_id === "pii_email")).toBe(true);
  });

  it("audit: payment_action → action=warn", async () => {
    const config = await buildConfigWithTemplates(["audit"]);
    const result = auditOutput(
      "We sent an invoice to the customer for $500.",
      config.boundary
    );
    expect(result.warnings.some((v) => v.rule_id === "payment_action")).toBe(true);
  });

  it("audit: contract_action → action=deny", async () => {
    const config = await buildConfigWithTemplates(["audit"]);
    const result = auditOutput(
      "We will sign-contract with the new vendor tomorrow.",
      config.boundary
    );
    expect(result.passed).toBe(false);
    expect(result.blocked.some((v) => v.rule_id === "contract_action")).toBe(true);
  });

  it("handoff: handoff_pending → action=warn", async () => {
    const config = await buildConfigWithTemplates(["handoff"]);
    const result = auditOutput(
      "Iwa is the delegate-to peer for this packet.",
      config.boundary
    );
    expect(result.warnings.some((v) => v.rule_id === "handoff_pending")).toBe(true);
  });

  it("handoff: stalled_task → action=warn", async () => {
    const config = await buildConfigWithTemplates(["handoff"]);
    const result = auditOutput(
      "This task has been orphaned for 3 weeks.",
      config.boundary
    );
    expect(result.warnings.some((v) => v.rule_id === "stalled_task")).toBe(true);
  });

  it("all 3 templates merged: simultaneously detects rules from each", async () => {
    const config = await buildConfigWithTemplates(["governance", "audit", "handoff"]);
    const result = auditOutput(
      [
        "This is confidential.",
        "Sign-contract with vendor.",
        "Task is orphaned for weeks.",
      ].join(" "),
      config.boundary
    );
    expect(result.passed).toBe(false);
    const ids = result.violations.map((v) => v.rule_id);
    expect(ids).toContain("confidential_doc");
    expect(ids).toContain("contract_action");
    expect(ids).toContain("stalled_task");
  });
});
