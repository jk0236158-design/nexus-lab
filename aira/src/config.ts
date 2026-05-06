/**
 * config.ts — yuino 商品化 Config schema (Zod)
 *
 * 5/02 起稿 (Iwa packet 10、Zen 先行 prototype)
 *
 * `yuino.config.yml` の parse + validation + premium boundary template merge support.
 *
 * Integration:
 *   import { loadConfig } from './config';
 *   const config = await loadConfig('./yuino.config.yml');
 *
 * Premium boundary template merge:
 *   user の config.yml に `boundary.templates: [governance, audit, handoff]` を declare すると、
 *   templates/boundary/<name>.boundary.yml の custom_rules を merge して final ruleset を構成する。
 */

import { z } from 'zod';

// === Gemini API config ===

export const GeminiConfigSchema = z.object({
  api_key_env: z.string().default('GEMINI_API_KEY'),
  model: z.enum([
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ]).default('gemini-2.5-flash'),
  budget_per_digest_usd: z.number().min(0).max(10).default(0.05),
  max_retries: z.number().int().min(0).max(5).default(2),
  timeout_seconds: z.number().int().min(5).max(300).default(60),
});

export type GeminiConfig = z.infer<typeof GeminiConfigSchema>;

// === Observer scope config ===

export const ObserverScopeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['file_directory']), // β scope。post-連休 で 'git_log' / 'slack_export' / 'notion_export' 拡張
  path: z.string().min(1),
  glob: z.string().default('**/*.md'),
  max_files: z.number().int().min(1).max(500).default(50),
  exclude: z.array(z.string()).default([]),
});

export type ObserverScope = z.infer<typeof ObserverScopeSchema>;

// === Boundary config ===

export const BoundaryActionSchema = z.enum(['deny', 'warn', 'log']);
export type BoundaryAction = z.infer<typeof BoundaryActionSchema>;

export const BoundaryRuleSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  action: BoundaryActionSchema.default('deny'),
  message: z.string().optional(),
});

export type BoundaryRule = z.infer<typeof BoundaryRuleSchema>;

export const BoundaryConfigSchema = z.object({
  monitor_types: z.array(z.enum(['scope_creep', 'sensitive_info_leak'])).default([
    'scope_creep',
    'sensitive_info_leak',
  ]),
  templates: z.array(z.string()).default([]), // premium template 名 list (e.g., 'governance', 'audit', 'handoff')
  custom_rules: z.array(BoundaryRuleSchema).default([]),
});

export type BoundaryConfig = z.infer<typeof BoundaryConfigSchema>;

// === Output destination config ===

export const OutputDestinationSchema = z.object({
  type: z.enum(['file', 'stdout']), // β scope。post-連休 で 'slack_webhook' / 'discord_webhook' / 'email' 拡張
  path: z.string().optional(), // type='file' の場合 required
  filename_template: z.string().default('{date}_digest.md'), // {date} = YYYY-MM-DD
});

export type OutputDestination = z.infer<typeof OutputDestinationSchema>;

// === Digest config ===

export const DigestScheduleSchema = z.enum(['daily', 'hourly', 'on_demand']);
export type DigestSchedule = z.infer<typeof DigestScheduleSchema>;

export const DigestConfigSchema = z.object({
  schedule: DigestScheduleSchema.default('on_demand'),
  domains: z.array(z.string()).min(1),
  output: z.array(OutputDestinationSchema).min(1),
});

export type DigestConfig = z.infer<typeof DigestConfigSchema>;

// === Contradiction notes / WAIT observations config ===

export const ContradictionNotesConfigSchema = z.object({
  enabled: z.boolean().default(true),
  levels: z.array(z.enum(['yellow', 'green', 'red'])).default(['yellow', 'green', 'red']),
});

export type ContradictionNotesConfig = z.infer<typeof ContradictionNotesConfigSchema>;

export const WaitObservationsConfigSchema = z.object({
  enabled: z.boolean().default(true),
});

export type WaitObservationsConfig = z.infer<typeof WaitObservationsConfigSchema>;

// === Top-level config schema ===

export const ConfigSchema = z.object({
  gemini: GeminiConfigSchema.default({}),
  observer_scopes: z.array(ObserverScopeSchema).min(1, 'At least one observer scope is required'),
  boundary: BoundaryConfigSchema.default({}),
  digest: DigestConfigSchema,
  contradiction_notes: ContradictionNotesConfigSchema.default({}),
  wait_observations: WaitObservationsConfigSchema.default({}),
});

export type Config = z.infer<typeof ConfigSchema>;

// === Config validation helpers ===

export function validateConfig(rawConfig: unknown): { ok: true; config: Config } | { ok: false; errors: string[] } {
  const result = ConfigSchema.safeParse(rawConfig);
  if (result.success) {
    return { ok: true, config: result.data };
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });
  return { ok: false, errors };
}

// === Premium template merge ===

/**
 * Resolve boundary templates by name → load template file → merge custom_rules into final ruleset.
 *
 * @param config validated Config (post-validateConfig)
 * @param templatesDir templates root directory (default: 'templates/boundary/')
 * @returns merged Config with templates resolved into custom_rules
 *
 * Note: Implementation reads files via fs/promises and yaml.parse, see config-loader.ts for actual impl.
 * This function in config.ts only declares the interface for type safety.
 */
export async function resolveBoundaryTemplates(
  config: Config,
  loadTemplate: (name: string) => Promise<{ custom_rules: BoundaryRule[] } | null>,
): Promise<Config> {
  if (config.boundary.templates.length === 0) {
    return config;
  }

  const mergedRules: BoundaryRule[] = [...config.boundary.custom_rules];

  for (const templateName of config.boundary.templates) {
    const template = await loadTemplate(templateName);
    if (!template) {
      throw new Error(`boundary template "${templateName}" not found`);
    }
    // Validate template rules conform to schema
    const validatedRules = template.custom_rules.map((rule) => BoundaryRuleSchema.parse(rule));
    mergedRules.push(...validatedRules);
  }

  return {
    ...config,
    boundary: {
      ...config.boundary,
      custom_rules: mergedRules,
      templates: [], // mark as resolved
    },
  };
}

// === Export sample config (for `yuino init` setup wizard) ===

export const SAMPLE_CONFIG: Config = {
  gemini: {
    api_key_env: 'GEMINI_API_KEY',
    model: 'gemini-1.5-flash',
    budget_per_digest_usd: 0.05,
    max_retries: 2,
    timeout_seconds: 60,
  },
  observer_scopes: [
    {
      id: 'my_team_status',
      type: 'file_directory',
      path: '~/team/status/',
      glob: '**/*.md',
      max_files: 50,
      exclude: [],
    },
  ],
  boundary: {
    monitor_types: ['scope_creep', 'sensitive_info_leak'],
    templates: [],
    custom_rules: [],
  },
  digest: {
    schedule: 'on_demand',
    domains: ['Domain A', 'Domain B'],
    output: [
      { type: 'file', path: './data/digests/', filename_template: '{date}_digest.md' },
      { type: 'stdout', filename_template: '{date}_digest.md' },
    ],
  },
  contradiction_notes: {
    enabled: true,
    levels: ['yellow', 'green', 'red'],
  },
  wait_observations: {
    enabled: true,
  },
};
