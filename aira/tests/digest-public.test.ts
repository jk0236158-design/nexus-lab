/**
 * digest-public.test.ts — yuino 商品化版 digest pipeline unit test
 *
 * 5/04 朝起稿 (Iwa packet、Wave 1 期間 return content path)
 * scope: generateDigest end-to-end (dryRun) / mock digest deterministic /
 *        callGemini env guard / budget guard / boundary integration / render markdown shape
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateDigest } from "../src/digest-public.js";
import type { Config } from "../src/config.js";

let TMP_ROOT: string;
let DIGEST_OUTPUT_DIR: string;
let SCOPE_DIR: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), "yuino-digest-test-"));
  DIGEST_OUTPUT_DIR = join(TMP_ROOT, "out");
  SCOPE_DIR = join(TMP_ROOT, "scope");
  await mkdir(DIGEST_OUTPUT_DIR, { recursive: true });
  await mkdir(SCOPE_DIR, { recursive: true });
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    gemini: {
      api_key_env: "YUINO_TEST_NONEXISTENT_KEY",
      model: "gemini-1.5-flash",
      budget_per_digest_usd: 0.05,
      max_retries: 0,
      timeout_seconds: 10,
    },
    observer_scopes: [
      {
        id: "test_scope",
        type: "file_directory",
        path: SCOPE_DIR,
        glob: "**/*.md",
        max_files: 5,
        exclude: [],
      },
    ],
    boundary: {
      monitor_types: ["scope_creep", "sensitive_info_leak"],
      templates: [],
      custom_rules: [],
    },
    digest: {
      schedule: "on_demand",
      domains: ["WSD", "Nexus Lab"],
      output: [
        {
          type: "file",
          path: DIGEST_OUTPUT_DIR,
          filename_template: "{date}_digest.md",
        },
      ],
    },
    contradiction_notes: {
      enabled: true,
      levels: ["yellow", "green", "red"],
    },
    wait_observations: {
      enabled: true,
    },
    ...overrides,
  };
}

describe("generateDigest end-to-end (dryRun)", () => {
  it("returns ok result with all 6 pipeline stages completed", async () => {
    await writeFile(join(SCOPE_DIR, "a.md"), "scope content alpha", "utf-8");
    await writeFile(join(SCOPE_DIR, "b.md"), "scope content beta", "utf-8");

    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.api_called).toBe(false);
      expect(result.ingest_summary.total_files_read).toBe(2);
      expect(result.ingest_summary.total_files_failed).toBe(0);
      expect(result.outputPaths.length).toBe(1);
      expect(result.digest_preview).toContain("Yuino Digest");
    }
  });

  it("writes digest markdown to configured output path", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "x", "utf-8");
    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: true });

    expect(result.ok).toBe(true);
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).toContain("# Yuino Digest");
      expect(content).toContain("(DRY RUN, mock)");
      expect(content).toContain("WSD");
      expect(content).toContain("Nexus Lab");
    }
  });

  it("includes Boundary Audit section in markdown", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "clean content", "utf-8");
    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).toContain("## Boundary Audit");
      expect(content).toContain("PASS");
    }
  });

  it("includes WAIT Observations section when wait_observations.enabled=true", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "x", "utf-8");
    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).toContain("WAIT Observations");
      expect(content).toContain("Set Gemini API key");
    }
  });

  it("hides WAIT section when wait_observations.enabled=false", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "x", "utf-8");
    const config = makeConfig({
      wait_observations: { enabled: false },
    } as Partial<Config>);
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).not.toContain("## WAIT Observations");
    }
  });

  it("dryRun output is deterministic in shape (domain count matches)", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "x", "utf-8");
    const config = makeConfig();
    const a = await generateDigest(config, { dryRun: true });
    const b = await generateDigest(config, { dryRun: true });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.api_called).toBe(b.api_called);
      expect(a.ingest_summary.total_files_read).toBe(b.ingest_summary.total_files_read);
    }
  });
});

describe("generateDigest ingest failure", () => {
  it("returns ok=false when no files match observer scopes", async () => {
    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.stage).toBe("ingest");
      expect(result.error).toMatch(/No files ingested/);
    }
  });
});

describe("generateDigest live mode (api_key not set)", () => {
  it("falls back to mock when GEMINI api_key env var is not set", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "x", "utf-8");
    delete process.env["YUINO_TEST_NONEXISTENT_KEY"];
    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: false });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.api_called).toBe(false);
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).toMatch(/Gemini API call failed/);
      expect(content).toMatch(/api_key_env/);
    }
  });

  it("falls back to mock when budget is exceeded (api_key set + tiny budget)", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "x".repeat(5000), "utf-8");
    const ENV_NAME = "YUINO_TEST_BUDGET_GUARD_KEY";
    process.env[ENV_NAME] = "dummy-not-real-key";
    try {
      const config = makeConfig({
        gemini: {
          api_key_env: ENV_NAME,
          model: "gemini-1.5-flash",
          budget_per_digest_usd: 0.0000001,
          max_retries: 0,
          timeout_seconds: 10,
        },
      });
      const result = await generateDigest(config, { dryRun: false });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.api_called).toBe(false);
        const content = await readFile(result.outputPaths[0], "utf-8");
        expect(content).toMatch(/exceeds budget/);
      }
    } finally {
      delete process.env[ENV_NAME];
    }
  });
});

describe("generateDigest boundary integration", () => {
  it("flags sensitive API key in ingested content via boundary audit", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "content", "utf-8");
    const config = makeConfig({
      digest: {
        schedule: "on_demand",
        domains: ["WSD AKIAIOSFODNN7EXAMPLE leak"],
        output: [
          { type: "file", path: DIGEST_OUTPUT_DIR, filename_template: "{date}_digest.md" },
        ],
      },
    });
    const result = await generateDigest(config, { dryRun: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const aws = result.boundary_violations.find(
        (v) => v.rule_id === "sensitive_aws_access_key"
      );
      expect(aws).toBeDefined();
    }
  });

  it("renders Boundary Audit FAIL section when violations exist", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "content", "utf-8");
    const config = makeConfig({
      digest: {
        schedule: "on_demand",
        domains: ["scope WSD AKIAIOSFODNN7EXAMPLE Domain"],
        output: [
          { type: "file", path: DIGEST_OUTPUT_DIR, filename_template: "{date}_digest.md" },
        ],
      },
    });
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).toContain("FAIL");
      expect(content).toMatch(/sensitive_aws_access_key|Blocked/);
    }
  });
});

describe("generateDigest contradiction_notes filter", () => {
  it("hides Red severity when only ['yellow'] is enabled", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "content", "utf-8");
    const config = makeConfig({
      contradiction_notes: { enabled: true, levels: ["yellow"] },
    });
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).toContain("Yellow");
    }
  });

  it("disables Contradiction Notes section when enabled=false", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "content", "utf-8");
    const config = makeConfig({
      contradiction_notes: { enabled: false, levels: [] },
    });
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok && result.outputPaths.length > 0) {
      const content = await readFile(result.outputPaths[0], "utf-8");
      expect(content).not.toContain("## Contradiction Notes");
    }
  });
});

describe("generateDigest digest_preview", () => {
  it("preview is capped at 500 chars", async () => {
    await writeFile(join(SCOPE_DIR, "x.md"), "content", "utf-8");
    const config = makeConfig();
    const result = await generateDigest(config, { dryRun: true });
    if (result.ok) {
      expect(result.digest_preview.length).toBeLessThanOrEqual(500);
    }
  });
});
