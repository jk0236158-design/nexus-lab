import path from "node:path";
import fs from "fs-extra";
import chalk from "chalk";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { ProjectConfig } from "./prompts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getTemplatesDir(): string {
  // In development: src/templates, in production: dist/../templates
  const devPath = path.resolve(__dirname, "..", "templates");
  const srcPath = path.resolve(__dirname, "templates");
  return fs.existsSync(devPath) ? devPath : srcPath;
}

const PREMIUM_TEMPLATES: Record<string, string> = {
  database: "https://nexuslabzen.gumroad.com/l/ijuvn",
  auth: "https://nexuslabzen.gumroad.com",
};

export async function generateProject(config: ProjectConfig): Promise<void> {
  // Premium templates are not bundled — redirect to purchase page
  const premiumUrl = PREMIUM_TEMPLATES[config.template];
  if (premiumUrl) {
    console.log();
    console.log(chalk.yellow.bold("  ★ Premium Template"));
    console.log();
    console.log(`  The ${chalk.bold(config.template)} template is a premium template.`);
    console.log();
    console.log(`  ${chalk.cyan("Get it here:")} ${premiumUrl}`);
    console.log();
    return;
  }

  const targetDir = path.resolve(process.cwd(), config.projectName);

  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      throw new Error(`Directory "${config.projectName}" already exists and is not empty`);
    }
  }

  console.log(chalk.dim(`  Creating project in ${targetDir}...`));

  // Copy template
  const templatesDir = getTemplatesDir();
  const templateDir = path.join(templatesDir, config.template);

  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template "${config.template}" not found at ${templateDir}`);
  }

  await fs.copy(templateDir, targetDir);

  // Update package.json with user config
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = await fs.readJson(pkgPath);
  pkg.name = config.projectName;
  pkg.description = config.description;
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });

  // Rename _gitignore to .gitignore (npm strips .gitignore from packages)
  const gitignoreSrc = path.join(targetDir, "_gitignore");
  if (await fs.pathExists(gitignoreSrc)) {
    await fs.rename(gitignoreSrc, path.join(targetDir, ".gitignore"));
  }

  // Git init
  if (config.git) {
    try {
      execSync("git init", { cwd: targetDir, stdio: "ignore" });
      console.log(chalk.dim("  Initialized git repository"));
    } catch {
      // Git not available, skip
    }
  }

  // npm install
  if (config.install) {
    console.log(chalk.dim("  Installing dependencies..."));
    try {
      execSync("npm install", { cwd: targetDir, stdio: "ignore" });
      console.log(chalk.dim("  Dependencies installed"));
    } catch {
      console.log(chalk.yellow("  Could not install dependencies. Run 'npm install' manually."));
    }
  }
}
