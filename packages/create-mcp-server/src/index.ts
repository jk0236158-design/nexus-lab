#!/usr/bin/env node

import { Command } from "commander";
import { runPrompts } from "./prompts.js";
import { generateProject } from "./generator.js";
import chalk from "chalk";

const program = new Command();

program
  .name("create-mcp-server")
  .description("Scaffold a new MCP server project with TypeScript and secure defaults")
  .version("0.3.0")
  .argument("[project-name]", "Name of the project to create")
  .option("-t, --template <template>", "Template to use (minimal, full, http)", "minimal")
  .option("--no-install", "Skip npm install")
  .option("--no-git", "Skip git init")
  .action(async (projectName: string | undefined, options) => {
    console.log();
    console.log(chalk.bold.cyan("  ⚡ create-mcp-server"));
    console.log(chalk.dim("  Scaffold a new MCP server in seconds"));
    console.log();

    try {
      const config = await runPrompts(projectName, options);
      await generateProject(config);

      console.log();
      console.log(chalk.green("  ✓ Project created successfully!"));
      console.log();
      console.log(`  ${chalk.dim("$")} cd ${config.projectName}`);
      if (options.install !== false) {
        console.log(`  ${chalk.dim("$")} npm run build`);
      } else {
        console.log(`  ${chalk.dim("$")} npm install`);
        console.log(`  ${chalk.dim("$")} npm run build`);
      }
      console.log(`  ${chalk.dim("$")} node dist/index.js`);
      console.log();
    } catch (error) {
      if (error instanceof Error && error.message === "cancelled") {
        console.log(chalk.yellow("\n  Cancelled."));
        process.exit(0);
      }
      console.error(chalk.red(`\n  Error: ${error}`));
      process.exit(1);
    }
  });

program.parse();
