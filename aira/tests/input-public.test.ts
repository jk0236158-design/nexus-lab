/**
 * input-public.test.ts — yuino 商品化版 input layer unit test
 *
 * 5/04 朝起稿 (Iwa packet、Wave 1 期間 return content path)
 * scope: matchesGlob / sortByMtimeDesc / listFilesRecursive (via ingestFileDirectory) /
 *        ingestFileDirectory / ingestAllScopes / ~/ home expansion
 *
 * Strategy: real fs (tmp dir via os.tmpdir() + mkdtemp), test ごとに setup/teardown
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, utimes } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join, sep } from "node:path";
import {
  ingestFileDirectory,
  ingestAllScopes,
  isIngestResult,
  type IngestResult,
} from "../src/input-public.js";
import type { ObserverScope } from "../src/config.js";

let TMP_ROOT: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), "yuino-input-test-"));
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

async function writeFixture(rel: string, content: string, mtime?: Date): Promise<string> {
  const full = join(TMP_ROOT, rel);
  await mkdir(join(full, ".."), { recursive: true });
  await writeFile(full, content, "utf-8");
  if (mtime) {
    await utimes(full, mtime, mtime);
  }
  return full;
}

function makeScope(overrides: Partial<ObserverScope> = {}): ObserverScope {
  return {
    id: "test_scope",
    type: "file_directory",
    path: TMP_ROOT,
    glob: "**/*.md",
    max_files: 50,
    exclude: [],
    ...overrides,
  };
}

describe("ingestFileDirectory glob matching", () => {
  it("matches '**/*.md' against nested .md files", async () => {
    await writeFixture("a.md", "alpha");
    await writeFixture("sub/b.md", "beta");
    await writeFixture("c.txt", "should not match");

    const results = await ingestFileDirectory(makeScope({ glob: "**/*.md" }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(2);
    const paths = successes.map((r) => r.path).sort();
    expect(paths.some((p) => p.endsWith(`a.md`))).toBe(true);
    expect(paths.some((p) => p.endsWith(`b.md`))).toBe(true);
  });

  it("matches '**/*' as wildcard (everything)", async () => {
    await writeFixture("a.md", "x");
    await writeFixture("b.txt", "y");

    const results = await ingestFileDirectory(makeScope({ glob: "**/*" }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(2);
  });

  it("matches simple '*.md' pattern via endsWith", async () => {
    await writeFixture("readme.md", "z");
    await writeFixture("readme.txt", "no");

    const results = await ingestFileDirectory(makeScope({ glob: "*.md" }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].path.endsWith("readme.md")).toBe(true);
  });

  it("matches brace expansion '**/*.{md,txt}'", async () => {
    await writeFixture("a.md", "1");
    await writeFixture("b.txt", "2");
    await writeFixture("c.json", "3");

    const results = await ingestFileDirectory(makeScope({ glob: "**/*.{md,txt}" }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(2);
  });

  it("falls back to substring match for unsupported glob form", async () => {
    await writeFixture("foo-special.log", "1");
    await writeFixture("bar.log", "2");

    const results = await ingestFileDirectory(makeScope({ glob: "special" }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].path.includes("special")).toBe(true);
  });
});

describe("ingestFileDirectory recursion + noise dir skip", () => {
  it("recurses into subdirectories", async () => {
    await writeFixture("a.md", "1");
    await writeFixture("sub1/b.md", "2");
    await writeFixture("sub1/sub2/c.md", "3");

    const results = await ingestFileDirectory(makeScope());
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(3);
  });

  it("skips node_modules / .git / .cache / dist", async () => {
    await writeFixture("a.md", "ok");
    await writeFixture("node_modules/should-skip.md", "skip");
    await writeFixture(".git/HEAD", "skip");
    await writeFixture(".cache/x.md", "skip");
    await writeFixture("dist/build.md", "skip");

    const results = await ingestFileDirectory(makeScope());
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].path.endsWith("a.md")).toBe(true);
  });

  it("respects user-defined exclude paths (substring match)", async () => {
    await writeFixture("keep.md", "1");
    await writeFixture("private/secret.md", "2");

    const results = await ingestFileDirectory(makeScope({ exclude: ["private"] }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].path.endsWith("keep.md")).toBe(true);
  });
});

describe("ingestFileDirectory mtime sort + max_files cap", () => {
  it("returns most-recent mtime first and applies max_files cap", async () => {
    const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const recent = new Date();
    await writeFixture("old.md", "old", old);
    await writeFixture("recent.md", "recent", recent);
    await writeFixture("middle.md", "middle", new Date(Date.now() - 1000 * 60 * 60));

    const results = await ingestFileDirectory(makeScope({ max_files: 2 }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(2);
    expect(successes.some((r) => r.path.endsWith("recent.md"))).toBe(true);
    expect(successes.some((r) => r.path.endsWith("old.md"))).toBe(false);
  });

  it("max_files=1 returns only the single most-recent file", async () => {
    await writeFixture("a.md", "a", new Date(Date.now() - 10_000));
    await writeFixture("b.md", "b", new Date());

    const results = await ingestFileDirectory(makeScope({ max_files: 1 }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].path.endsWith("b.md")).toBe(true);
  });
});

describe("ingestFileDirectory result fields", () => {
  it("propagates scope.id into each IngestResult", async () => {
    await writeFixture("a.md", "hello");
    const results = await ingestFileDirectory(makeScope({ id: "my_special_scope" }));
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].scope_id).toBe("my_special_scope");
  });

  it("computes bytes correctly for utf-8 content (multibyte safe)", async () => {
    const content = "日本語テスト";
    await writeFixture("jp.md", content);
    const results = await ingestFileDirectory(makeScope());
    const successes = results.filter(isIngestResult);
    expect(successes.length).toBe(1);
    expect(successes[0].bytes).toBe(Buffer.byteLength(content, "utf-8"));
    expect(successes[0].content).toBe(content);
  });
});

describe("ingestFileDirectory error handling", () => {
  it("returns IngestError when path does not exist", async () => {
    const scope = makeScope({ path: join(TMP_ROOT, "does-not-exist") });
    const results = await ingestFileDirectory(scope);
    expect(results.length).toBe(1);
    expect(isIngestResult(results[0])).toBe(false);
    if (!isIngestResult(results[0])) {
      expect(results[0].error).toMatch(/Directory not found/);
      expect(results[0].scope_id).toBe("test_scope");
    }
  });

  it("returns IngestError when path is a file (not a directory)", async () => {
    const filePath = await writeFixture("not-a-dir.md", "x");
    const scope = makeScope({ path: filePath });
    const results = await ingestFileDirectory(scope);
    expect(results.length).toBe(1);
    expect(isIngestResult(results[0])).toBe(false);
    if (!isIngestResult(results[0])) {
      expect(results[0].error).toMatch(/Not a directory/);
    }
  });

  it("returns IngestError for unsupported scope.type", async () => {
    const scope = { ...makeScope(), type: "git_log" } as unknown as ObserverScope;
    const results = await ingestFileDirectory(scope);
    expect(results.length).toBe(1);
    expect(isIngestResult(results[0])).toBe(false);
    if (!isIngestResult(results[0])) {
      expect(results[0].error).toMatch(/Unsupported scope type/);
    }
  });
});

describe("ingestFileDirectory home (~/) expansion", () => {
  it("expands '~/' prefix to homedir() (negative test: nonexistent path under home)", async () => {
    const scope = makeScope({ path: "~/__yuino_test_nonexistent_dir__" });
    const results = await ingestFileDirectory(scope);
    expect(results.length).toBe(1);
    if (!isIngestResult(results[0])) {
      expect(results[0].path).toBeDefined();
      expect(results[0].path!.startsWith(homedir())).toBe(true);
    }
  });
});

describe("ingestAllScopes multi-scope", () => {
  it("merges results from multiple scopes and aggregates summary", async () => {
    await writeFixture("a/x.md", "1");
    await writeFixture("b/y.md", "22");
    const scopes: ObserverScope[] = [
      makeScope({ id: "scope_a", path: join(TMP_ROOT, "a") }),
      makeScope({ id: "scope_b", path: join(TMP_ROOT, "b") }),
    ];

    const { outcomes, summary } = await ingestAllScopes(scopes);
    expect(outcomes.length).toBe(2);
    expect(summary.total_files_read).toBe(2);
    expect(summary.total_files_failed).toBe(0);
    expect(summary.total_bytes_read).toBe(3);
    expect(summary.by_scope["scope_a"].files).toBe(1);
    expect(summary.by_scope["scope_b"].files).toBe(1);
  });

  it("reports errors per-scope without aborting other scopes", async () => {
    await writeFixture("ok/file.md", "ok");
    const scopes: ObserverScope[] = [
      makeScope({ id: "good", path: join(TMP_ROOT, "ok") }),
      makeScope({ id: "bad", path: join(TMP_ROOT, "missing-dir") }),
    ];

    const { outcomes, summary } = await ingestAllScopes(scopes);
    expect(summary.total_files_read).toBe(1);
    expect(summary.total_files_failed).toBe(1);
    expect(summary.by_scope["good"].files).toBe(1);
    expect(summary.by_scope["bad"].errors).toBe(1);
    expect(outcomes.length).toBe(2);
  });

  it("handles empty scope list (still produces zero-summary)", async () => {
    const { outcomes, summary } = await ingestAllScopes([]);
    expect(outcomes.length).toBe(0);
    expect(summary.total_files_read).toBe(0);
    expect(summary.total_files_failed).toBe(0);
    expect(summary.total_bytes_read).toBe(0);
    expect(Object.keys(summary.by_scope).length).toBe(0);
  });
});
