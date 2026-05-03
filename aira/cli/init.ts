/**
 * cli/init.ts — `yuino init` interactive setup wizard
 *
 * 5/02 起稿 (Iwa packet 9 part 2、Zen 先行 prototype)
 *
 * Flow:
 *   1. existing config check (overwrite confirm)
 *   2. Gemini API key env var name
 *   3. observer_scopes (file_directory, glob, path)
 *   4. digest output (file / stdout)
 *   5. boundary monitor types + premium templates select
 *   6. write to outputPath
 */

import { writeFile, access } from 'node:fs/promises';
import * as yaml from 'js-yaml';
import prompts from 'prompts';
import { Config, SAMPLE_CONFIG } from '../src/config.js';

export interface InitOptions {
  outputPath: string;
  force: boolean;
}

export interface InitResultOk {
  ok: true;
  path: string;
}

export interface InitResultErr {
  ok: false;
  error: string;
}

export type InitResult = InitResultOk | InitResultErr;

export async function initCommand(opts: InitOptions): Promise<InitResult> {
  // 1. existing config check
  const exists = await fileExists(opts.outputPath);
  if (exists && !opts.force) {
    const overwrite = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: `Config exists at ${opts.outputPath}. Overwrite?`,
      initial: false,
    });
    if (!overwrite.overwrite) {
      return { ok: false, error: 'aborted by user' };
    }
  }

  // 2. Gemini API key env var name
  const geminiAnswers = await prompts([
    {
      type: 'text',
      name: 'api_key_env',
      message: 'Gemini API key environment variable name:',
      initial: 'GEMINI_API_KEY',
    },
    {
      type: 'select',
      name: 'model',
      message: 'Gemini model:',
      choices: [
        { title: 'gemini-1.5-flash (cheap, fast)', value: 'gemini-1.5-flash' },
        { title: 'gemini-1.5-pro (higher quality)', value: 'gemini-1.5-pro' },
        { title: 'gemini-2.0-flash-exp (experimental)', value: 'gemini-2.0-flash-exp' },
      ],
      initial: 0,
    },
  ]);

  // 3. observer_scopes (loop until user is done)
  const observer_scopes: Config['observer_scopes'] = [];
  let addMore = true;
  while (addMore) {
    const scopeAnswers = await prompts([
      {
        type: 'text',
        name: 'id',
        message: `Observer scope #${observer_scopes.length + 1} — id (e.g., 'team_status'):`,
        validate: (val: string) => (val.trim().length > 0 ? true : 'id is required'),
      },
      {
        type: 'text',
        name: 'path',
        message: 'Observer scope path:',
        validate: (val: string) => (val.trim().length > 0 ? true : 'path is required'),
      },
      {
        type: 'text',
        name: 'glob',
        message: 'Glob pattern:',
        initial: '**/*.md',
      },
      {
        type: 'number',
        name: 'max_files',
        message: 'Max files to ingest:',
        initial: 50,
        min: 1,
        max: 500,
      },
    ]);

    if (!scopeAnswers.id) break; // user aborted

    observer_scopes.push({
      id: scopeAnswers.id,
      type: 'file_directory',
      path: scopeAnswers.path,
      glob: scopeAnswers.glob || '**/*.md',
      max_files: scopeAnswers.max_files,
      exclude: [],
    });

    const more = await prompts({
      type: 'confirm',
      name: 'more',
      message: 'Add another observer scope?',
      initial: false,
    });
    addMore = more.more === true;
  }

  if (observer_scopes.length === 0) {
    return { ok: false, error: 'at least one observer scope is required' };
  }

  // 4. digest output destinations
  const outputAnswers = await prompts([
    {
      type: 'text',
      name: 'file_path',
      message: 'Digest output directory (file destination):',
      initial: './data/digests/',
    },
    {
      type: 'confirm',
      name: 'enable_stdout',
      message: 'Also output to stdout?',
      initial: true,
    },
    {
      type: 'list',
      name: 'domains',
      message: 'Digest domains (comma-separated):',
      initial: 'Domain A, Domain B',
      separator: ',',
    },
  ]);

  // 5. boundary
  const boundaryAnswers = await prompts([
    {
      type: 'multiselect',
      name: 'monitor_types',
      message: 'Boundary monitor types (default: both selected):',
      choices: [
        { title: 'scope_creep', value: 'scope_creep', selected: true },
        { title: 'sensitive_info_leak', value: 'sensitive_info_leak', selected: true },
      ],
    },
    {
      type: 'multiselect',
      name: 'templates',
      message: 'Premium boundary templates to apply (none selected by default):',
      choices: [
        { title: 'governance — 機密 / PII / 内部判断', value: 'governance' },
        { title: 'audit — 金銭 / external transaction', value: 'audit' },
        { title: 'handoff — peer 間 handoff orphan detection', value: 'handoff' },
      ],
    },
  ]);

  // 6. compose config + write
  const output: Config['digest']['output'] = [
    {
      type: 'file',
      path: outputAnswers.file_path || './data/digests/',
      filename_template: '{date}_digest.md',
    },
  ];
  if (outputAnswers.enable_stdout) {
    output.push({ type: 'stdout', filename_template: '{date}_digest.md' });
  }

  const config: Config = {
    gemini: {
      api_key_env: geminiAnswers.api_key_env,
      model: geminiAnswers.model,
      budget_per_digest_usd: 0.05,
      max_retries: 2,
      timeout_seconds: 60,
    },
    observer_scopes,
    boundary: {
      monitor_types: boundaryAnswers.monitor_types ?? ['scope_creep', 'sensitive_info_leak'],
      templates: boundaryAnswers.templates ?? [],
      custom_rules: [],
    },
    digest: {
      schedule: 'on_demand',
      domains: (outputAnswers.domains as string[]).map((s) => s.trim()).filter((s) => s.length > 0),
      output,
    },
    contradiction_notes: { enabled: true, levels: ['yellow', 'green', 'red'] },
    wait_observations: { enabled: true },
  };

  const yamlText = yaml.dump(config, { lineWidth: 100, noRefs: true });
  const header = `# yuino.config.yml — generated by 'yuino init' on ${new Date().toISOString()}\n# edit this file to customize observer scopes, boundary rules, output destinations\n\n`;

  try {
    await writeFile(opts.outputPath, header + yamlText, 'utf8');
    return { ok: true, path: opts.outputPath };
  } catch (err) {
    return { ok: false, error: `Failed to write config: ${(err as Error).message}` };
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
