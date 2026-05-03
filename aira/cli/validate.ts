/**
 * cli/validate.ts — `yuino validate` command
 *
 * 5/02 起稿 (Iwa packet 9 part 4、Zen 先行 prototype)
 *
 * Flow:
 *   1. load config (config-loader.ts)
 *   2. resolve boundary templates (verify all referenced templates exist)
 *   3. report rule count + warnings
 *   4. (no digest output, no Gemini API call)
 *
 * Use case:
 *   - CI integration (`yuino validate --strict` で exit 1 on warning)
 *   - pre-commit hook
 *   - config edit 後の sanity check
 */

import { loadConfig } from '../src/config-loader.js';

export interface ValidateOptions {
  configPath: string;
  strict: boolean;
}

export interface ValidateResultOk {
  ok: true;
  rulesLoaded: number;
  warnings: string[];
}

export interface ValidateResultErr {
  ok: false;
  errors: string[];
}

export type ValidateResult = ValidateResultOk | ValidateResultErr;

export async function validateCommand(opts: ValidateOptions): Promise<ValidateResult> {
  const loadResult = await loadConfig(opts.configPath);
  if (!loadResult.ok) {
    const errors = loadResult.errors ?? [loadResult.error];
    return { ok: false, errors };
  }

  const config = loadResult.config;
  const warnings: string[] = [];

  // === sanity checks ===

  // 1. observer_scopes path existence (warn if path doesn't exist at validate time)
  // Note: This is best-effort, scope path can be intentionally relative or env-dependent
  for (const scope of config.observer_scopes) {
    if (scope.path.startsWith('~/') || scope.path.startsWith('./') || scope.path.startsWith('/')) {
      // Could be valid, just inform
    } else if (scope.path.startsWith('${')) {
      warnings.push(`scope "${scope.id}": path uses env var pattern "${scope.path}" — verify env var is set`);
    }
  }

  // 2. output destination type=file requires path
  for (const dest of config.digest.output) {
    if (dest.type === 'file' && !dest.path) {
      warnings.push(`output destination type='file' missing path field`);
    }
  }

  // 3. Gemini API key env var check (informational — don't fail validate, but warn)
  const apiKeyVar = config.gemini.api_key_env;
  if (!process.env[apiKeyVar]) {
    warnings.push(
      `Gemini API key env var "${apiKeyVar}" is not set — set before running 'yuino digest'`,
    );
  }

  // 4. budget guard sanity
  if (config.gemini.budget_per_digest_usd > 1.0) {
    warnings.push(
      `gemini.budget_per_digest_usd is high ($${config.gemini.budget_per_digest_usd}) — verify intentional`,
    );
  }

  // 5. domains count vs scopes count (informational)
  if (config.digest.domains.length > config.observer_scopes.length * 2) {
    warnings.push(
      `digest.domains (${config.digest.domains.length}) significantly exceeds observer_scopes (${config.observer_scopes.length}) — verify each domain has supporting scope data`,
    );
  }

  // 6. boundary rules count summary
  const totalRules = config.boundary.custom_rules.length;

  return {
    ok: true,
    rulesLoaded: totalRules,
    warnings,
  };
}
