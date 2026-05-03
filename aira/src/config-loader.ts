/**
 * config-loader.ts — `yuino.config.yml` file read + YAML parse + schema validate
 *
 * 5/02 起稿 (Iwa packet 10、Zen 先行 prototype)
 *
 * Dependencies:
 *   - js-yaml (or yaml): YAML parse
 *   - fs/promises: file read
 *
 * Usage:
 *   import { loadConfig, loadBoundaryTemplate } from './config-loader';
 *   const config = await loadConfig('./yuino.config.yml');
 *   const resolvedConfig = await resolveBoundaryTemplates(config, loadBoundaryTemplate);
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import {
  Config,
  BoundaryRule,
  ConfigSchema,
  validateConfig,
  resolveBoundaryTemplates,
} from './config.js';

// === Top-level config loader ===

export interface LoadConfigError {
  ok: false;
  error: string;
  errors?: string[];
}

export interface LoadConfigSuccess {
  ok: true;
  config: Config;
}

export type LoadConfigResult = LoadConfigSuccess | LoadConfigError;

/**
 * Load `yuino.config.yml` file → parse → validate → resolve boundary templates.
 *
 * @param configPath path to config file (relative or absolute)
 * @param templatesDir templates root directory (default: 'templates/boundary/' relative to package root)
 * @returns LoadConfigResult (ok: true with config | ok: false with error[s])
 */
export async function loadConfig(
  configPath: string,
  templatesDir?: string,
): Promise<LoadConfigResult> {
  let rawText: string;
  try {
    rawText = await readFile(configPath, 'utf8');
  } catch (err) {
    return {
      ok: false,
      error: `Failed to read config file at "${configPath}": ${(err as Error).message}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(rawText);
  } catch (err) {
    return {
      ok: false,
      error: `Failed to parse YAML in "${configPath}": ${(err as Error).message}`,
    };
  }

  const validation = validateConfig(parsed);
  if (!validation.ok) {
    return {
      ok: false,
      error: `Config validation failed for "${configPath}"`,
      errors: validation.errors,
    };
  }

  const config = validation.config;

  // Resolve premium boundary templates
  if (config.boundary.templates.length > 0) {
    const resolvedTemplatesDir = templatesDir ?? defaultTemplatesDir();
    try {
      const resolved = await resolveBoundaryTemplates(config, (name) =>
        loadBoundaryTemplate(name, resolvedTemplatesDir),
      );
      return { ok: true, config: resolved };
    } catch (err) {
      return {
        ok: false,
        error: `Failed to resolve boundary templates: ${(err as Error).message}`,
      };
    }
  }

  return { ok: true, config };
}

// === Boundary template loader ===

export async function loadBoundaryTemplate(
  name: string,
  templatesDir: string,
): Promise<{ custom_rules: BoundaryRule[] } | null> {
  const templatePath = resolve(templatesDir, `${name}.boundary.yml`);
  let rawText: string;
  try {
    rawText = await readFile(templatePath, 'utf8');
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = yaml.load(rawText);
  } catch (err) {
    throw new Error(`Failed to parse template "${name}" at ${templatePath}: ${(err as Error).message}`);
  }

  // Template structure: { version, name, description, custom_rules: [...], metadata? }
  if (!parsed || typeof parsed !== 'object' || !('custom_rules' in parsed)) {
    throw new Error(`Template "${name}" missing custom_rules field`);
  }

  return parsed as { custom_rules: BoundaryRule[] };
}

// === Defaults ===

function defaultTemplatesDir(): string {
  // ESM-friendly module-relative path resolution
  // Falls back to 'templates/boundary' relative to cwd if URL resolution fails
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return resolve(__dirname, '..', 'templates', 'boundary');
  } catch {
    return resolve(process.cwd(), 'templates', 'boundary');
  }
}

// === Re-export for convenience ===

export { ConfigSchema, validateConfig, resolveBoundaryTemplates } from './config.js';
export type { Config, BoundaryRule } from './config.js';
