import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import fs from "fs-extra";
import os from "node:os";
import { generateProject } from "../src/generator.js";
import type { ProjectConfig } from "../src/prompts.js";

const TEST_DIR = path.join(os.tmpdir(), "create-mcp-server-test");

function makeConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: `test-project-${Date.now()}`,
    description: "Test project",
    template: "minimal",
    install: false,
    git: false,
    ...overrides,
  };
}

afterEach(async () => {
  // Clean up any test projects in temp dir
  if (await fs.pathExists(TEST_DIR)) {
    await fs.remove(TEST_DIR);
  }
});

describe("generateProject", () => {
  it("should create a minimal project with correct structure", async () => {
    const config = makeConfig({ projectName: path.join(TEST_DIR, "test-minimal") });
    await generateProject(config);

    const targetDir = path.resolve(process.cwd(), config.projectName);
    expect(await fs.pathExists(targetDir)).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, "package.json"))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, "tsconfig.json"))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, "src", "index.ts"))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, ".gitignore"))).toBe(true);

    // Verify package.json was updated
    const pkg = await fs.readJson(path.join(targetDir, "package.json"));
    expect(pkg.name).toBe(config.projectName);
    expect(pkg.description).toBe("Test project");

    await fs.remove(targetDir);
  });

  it("should create a full project with tests directory", async () => {
    const config = makeConfig({
      projectName: path.join(TEST_DIR, "test-full"),
      template: "full",
    });
    await generateProject(config);

    const targetDir = path.resolve(process.cwd(), config.projectName);
    expect(await fs.pathExists(path.join(targetDir, "src", "tools.ts"))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, "src", "resources.ts"))).toBe(true);
    expect(await fs.pathExists(path.join(targetDir, "tests"))).toBe(true);

    await fs.remove(targetDir);
  });

  it("should create an http project with express setup", async () => {
    const config = makeConfig({
      projectName: path.join(TEST_DIR, "test-http"),
      template: "http",
    });
    await generateProject(config);

    const targetDir = path.resolve(process.cwd(), config.projectName);
    const pkg = await fs.readJson(path.join(targetDir, "package.json"));
    expect(pkg.dependencies).toHaveProperty("express");

    await fs.remove(targetDir);
  });

  it("should throw if directory exists and is not empty", async () => {
    const name = path.join(TEST_DIR, "test-exists");
    const targetDir = path.resolve(process.cwd(), name);
    await fs.ensureDir(targetDir);
    await fs.writeFile(path.join(targetDir, "file.txt"), "test");

    const config = makeConfig({ projectName: name });
    await expect(generateProject(config)).rejects.toThrow("already exists");

    await fs.remove(targetDir);
  });
});
