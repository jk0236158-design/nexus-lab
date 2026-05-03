#!/usr/bin/env node
/**
 * cli/index.ts — yuino CLI entry point (β scope)
 *
 * 5/02 起稿 (Iwa packet 9、Zen 先行 prototype)
 *
 * Commands:
 *   yuino init              — interactive setup wizard、config.yml 生成
 *   yuino digest            — config 読込 → digest 1 回実行
 *   yuino validate          — config schema validation + boundary audit dry-run
 *   yuino --help / -h       — usage
 *   yuino --version / -v    — version
 *
 * Dependencies (β scope):
 *   - commander: argv parse
 *   - (init only) prompts: interactive wizard
 *
 * Note: `digest` command body は src/digest.ts の existing main entry を invoke する thin wrapper、
 * full impl は Iwa 5/04 で integration。本 stub は CLI structure を提示する。
 */

import { Command } from 'commander';
import { resolve } from 'node:path';
import { initCommand } from './init.js';
import { digestCommand } from './digest.js';
import { validateCommand } from './validate.js';

// Read package version (resolved at build time via tsc)
// In ts-node mode, falls back to a literal default
const PKG_VERSION = process.env.npm_package_version ?? '0.1.0-beta.0';

const program = new Command();

program
  .name('yuino')
  .description('Owner Digest for AI Operations — 1 owner + multi-AI org の全体観望 layer')
  .version(PKG_VERSION, '-v, --version');

program
  .command('init')
  .description('Interactive setup wizard: create yuino.config.yml')
  .option('-o, --output <path>', 'output config file path', './yuino.config.yml')
  .option('-f, --force', 'overwrite existing config without prompt', false)
  .action(async (opts) => {
    try {
      const result = await initCommand({
        outputPath: resolve(opts.output),
        force: opts.force,
      });
      if (!result.ok) {
        process.stderr.write(`✘ init failed: ${result.error}\n`);
        process.exit(1);
      }
      process.stdout.write(`✓ created ${result.path}\n`);
      process.stdout.write('  next: configure GEMINI_API_KEY env var, then run "yuino digest"\n');
    } catch (err) {
      process.stderr.write(`✘ init error: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

program
  .command('digest')
  .description('Run digest with configured scopes + Gemini API')
  .option('-c, --config <path>', 'config file path', './yuino.config.yml')
  .option('--dry-run', 'skip Gemini API call (use mock digest)', false)
  .action(async (opts) => {
    try {
      const result = await digestCommand({
        configPath: resolve(opts.config),
        dryRun: opts.dryRun,
      });
      if (!result.ok) {
        const stage = result.stage ? ` [stage: ${result.stage}]` : '';
        process.stderr.write(`✘ digest failed${stage}: ${result.error}\n`);
        process.exit(1);
      }
      const apiInfo = result.apiCalled
        ? ` (Gemini API called, est. cost $${(result.apiCostUsd ?? 0).toFixed(4)})`
        : ' (DRY RUN, no API call)';
      process.stdout.write(`✓ digest written to ${result.outputPaths.join(', ')}${apiInfo}\n`);
      process.stdout.write(
        `  ingested: ${result.ingestSummary.totalFilesRead} files (${result.ingestSummary.totalBytesRead} bytes)\n`,
      );
      if (result.ingestSummary.totalFailed > 0) {
        process.stderr.write(`  ⚠ ${result.ingestSummary.totalFailed} file(s) failed to ingest\n`);
      }
      if (result.boundaryViolations.length > 0) {
        const blocked = result.boundaryViolations.filter((v) => v.action === 'deny').length;
        const warnings = result.boundaryViolations.filter((v) => v.action === 'warn').length;
        process.stderr.write(
          `  ⚠ ${result.boundaryViolations.length} boundary violation(s) detected (blocked: ${blocked}, warnings: ${warnings})\n`,
        );
      }
    } catch (err) {
      process.stderr.write(`✘ digest error: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate config + boundary audit dry-run (no digest output)')
  .option('-c, --config <path>', 'config file path', './yuino.config.yml')
  .option('--strict', 'exit 1 on any warning', false)
  .action(async (opts) => {
    try {
      const result = await validateCommand({
        configPath: resolve(opts.config),
        strict: opts.strict,
      });
      if (!result.ok) {
        process.stderr.write('✘ validation failed:\n');
        for (const err of result.errors) {
          process.stderr.write(`  - ${err}\n`);
        }
        process.exit(1);
      }
      process.stdout.write(`✓ validation passed (${result.rulesLoaded} boundary rules loaded)\n`);
      if (result.warnings.length > 0) {
        process.stdout.write(`⚠ ${result.warnings.length} warning(s):\n`);
        for (const w of result.warnings) {
          process.stdout.write(`  - ${w}\n`);
        }
        if (opts.strict) process.exit(1);
      }
    } catch (err) {
      process.stderr.write(`✘ validate error: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`✘ unexpected error: ${(err as Error).message}\n`);
  process.exit(1);
});
