/**
 * output-public.test.ts — yuino 商品化版 output layer unit test
 *
 * 5/04 朝起稿 (Iwa packet、Wave 1 期間 return content path)
 * scope: filename_template / writeToDestination (file + stdout) / writeToDestinations (multi) /
 *        getOutputPaths / partial failure reporting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  writeToDestination,
  writeToDestinations,
  getOutputPaths,
  isOutputResult,
} from "../src/output-public.js";
import type { OutputDestination } from "../src/config.js";

let TMP_ROOT: string;

beforeEach(async () => {
  TMP_ROOT = await mkdtemp(join(tmpdir(), "yuino-output-test-"));
});

afterEach(async () => {
  if (TMP_ROOT) {
    await rm(TMP_ROOT, { recursive: true, force: true });
  }
});

describe("filename_template {date} expansion", () => {
  it("replaces {date} with provided date string", async () => {
    const dest: OutputDestination = {
      type: "file",
      path: TMP_ROOT,
      filename_template: "{date}_digest.md",
    };
    const outcome = await writeToDestination("hello", dest, "2026-05-04");
    expect(isOutputResult(outcome)).toBe(true);
    if (isOutputResult(outcome)) {
      expect(outcome.path!.endsWith("2026-05-04_digest.md")).toBe(true);
    }
  });

  it("replaces multiple occurrences of {date}", async () => {
    const dest: OutputDestination = {
      type: "file",
      path: TMP_ROOT,
      filename_template: "{date}_yuino_{date}.md",
    };
    const outcome = await writeToDestination("x", dest, "2026-05-04");
    if (isOutputResult(outcome)) {
      expect(outcome.path!.endsWith("2026-05-04_yuino_2026-05-04.md")).toBe(true);
    }
  });

  it("leaves unsupported placeholders ({scope}, {timestamp}) as literals (current spec)", async () => {
    const dest: OutputDestination = {
      type: "file",
      path: TMP_ROOT,
      filename_template: "{date}_{scope}_{timestamp}.md",
    };
    const outcome = await writeToDestination("x", dest, "2026-05-04");
    if (isOutputResult(outcome)) {
      expect(outcome.path!.endsWith("2026-05-04_{scope}_{timestamp}.md")).toBe(true);
    }
  });
});

describe("writeToDestination file", () => {
  it("writes content to disk and reports bytes_written", async () => {
    const dest: OutputDestination = {
      type: "file",
      path: TMP_ROOT,
      filename_template: "{date}.md",
    };
    const content = "yuino digest\n日本語";
    const outcome = await writeToDestination(content, dest, "2026-05-04");
    expect(isOutputResult(outcome)).toBe(true);
    if (isOutputResult(outcome)) {
      expect(outcome.destination_type).toBe("file");
      expect(outcome.bytes_written).toBe(Buffer.byteLength(content, "utf-8"));
      const written = await readFile(outcome.path!, "utf-8");
      expect(written).toBe(content);
    }
  });

  it("creates nested directory recursively", async () => {
    const nested = join(TMP_ROOT, "deep", "nested", "dir");
    const dest: OutputDestination = {
      type: "file",
      path: nested,
      filename_template: "{date}.md",
    };
    const outcome = await writeToDestination("ok", dest, "2026-05-04");
    expect(isOutputResult(outcome)).toBe(true);
    if (isOutputResult(outcome)) {
      const s = await stat(outcome.path!);
      expect(s.isFile()).toBe(true);
    }
  });

  it("is idempotent (overwrites on repeat write)", async () => {
    const dest: OutputDestination = {
      type: "file",
      path: TMP_ROOT,
      filename_template: "{date}.md",
    };
    const a = await writeToDestination("first", dest, "2026-05-04");
    const b = await writeToDestination("second", dest, "2026-05-04");
    if (isOutputResult(a) && isOutputResult(b)) {
      expect(a.path).toBe(b.path);
      const written = await readFile(b.path!, "utf-8");
      expect(written).toBe("second");
    }
  });

  it("returns OutputError when type='file' but path is missing", async () => {
    const dest = {
      type: "file",
      filename_template: "{date}.md",
    } as OutputDestination;
    const outcome = await writeToDestination("x", dest, "2026-05-04");
    expect(isOutputResult(outcome)).toBe(false);
    if (!isOutputResult(outcome)) {
      expect(outcome.error).toMatch(/requires `path`/);
    }
  });
});

describe("writeToDestination stdout", () => {
  it("writes content to stdout and reports bytes_written", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const dest: OutputDestination = {
        type: "stdout",
        filename_template: "{date}.md",
      };
      const content = "stdout test";
      const outcome = await writeToDestination(content, dest, "2026-05-04");
      expect(isOutputResult(outcome)).toBe(true);
      if (isOutputResult(outcome)) {
        expect(outcome.destination_type).toBe("stdout");
        expect(outcome.bytes_written).toBe(Buffer.byteLength(content, "utf-8"));
        expect(outcome.path).toBeUndefined();
      }
      expect(spy).toHaveBeenCalledWith(content);
      expect(spy).toHaveBeenCalledWith("\n");
    } finally {
      spy.mockRestore();
    }
  });

  it("does not append extra newline if content already ends with \\n", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const dest: OutputDestination = {
        type: "stdout",
        filename_template: "{date}.md",
      };
      const content = "ends with newline\n";
      await writeToDestination(content, dest, "2026-05-04");
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(content);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("writeToDestination unsupported types", () => {
  it("returns OutputError for unsupported type", async () => {
    const dest = {
      type: "slack_webhook",
      filename_template: "{date}.md",
    } as unknown as OutputDestination;
    const outcome = await writeToDestination("x", dest, "2026-05-04");
    expect(isOutputResult(outcome)).toBe(false);
    if (!isOutputResult(outcome)) {
      expect(outcome.error).toMatch(/Unsupported destination type/);
    }
  });
});

describe("writeToDestinations multi-destination", () => {
  it("writes to file + stdout in parallel and reports both outcomes", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const destinations: OutputDestination[] = [
        { type: "file", path: TMP_ROOT, filename_template: "{date}.md" },
        { type: "stdout", filename_template: "{date}.md" },
      ];
      const result = await writeToDestinations("multi", destinations, "2026-05-04");
      expect(result.success_count).toBe(2);
      expect(result.error_count).toBe(0);
      expect(result.outcomes.length).toBe(2);
      expect(result.outcomes.every(isOutputResult)).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it("reports partial failure (one good, one bad)", async () => {
    const destinations: OutputDestination[] = [
      { type: "file", path: TMP_ROOT, filename_template: "{date}.md" },
      { type: "file", filename_template: "{date}.md" } as OutputDestination,
    ];
    const result = await writeToDestinations("partial", destinations, "2026-05-04");
    expect(result.success_count).toBe(1);
    expect(result.error_count).toBe(1);
    expect(result.outcomes.length).toBe(2);
  });

  it("uses today's date as default when omitted", async () => {
    const destinations: OutputDestination[] = [
      { type: "file", path: TMP_ROOT, filename_template: "{date}.md" },
    ];
    const result = await writeToDestinations("default-date", destinations);
    const today = new Date().toISOString().slice(0, 10);
    if (isOutputResult(result.outcomes[0])) {
      expect(result.outcomes[0].path!.endsWith(`${today}.md`)).toBe(true);
    }
  });
});

describe("getOutputPaths helper", () => {
  it("returns only file paths from successful outcomes (excludes stdout / errors)", async () => {
    const spy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      const destinations: OutputDestination[] = [
        { type: "file", path: TMP_ROOT, filename_template: "a.md" },
        { type: "stdout", filename_template: "x.md" },
        { type: "file", filename_template: "missing.md" } as OutputDestination,
      ];
      const result = await writeToDestinations("x", destinations, "2026-05-04");
      const paths = getOutputPaths(result.outcomes);
      expect(paths.length).toBe(1);
      expect(paths[0].endsWith("a.md")).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
