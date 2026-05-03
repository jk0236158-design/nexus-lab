/**
 * boundary-public.ts — 商品化版 boundary audit (user-configurable monitor types)
 *
 * 5/02 起稿 (Iwa packet 6、Zen 先行 prototype)
 *
 * 既存 boundary.ts は nokaze internal #9-11 hard-coded、本 file は商品化用 user-configurable 版。
 * Iwa 5/04 で boundary.ts と本 file を merge or rename judgment。本 stub は商品化 layer の structure を示す。
 *
 * Builtin monitor types (β scope):
 *   - scope_creep: action 種別の boundary check (config で extend 可能)
 *   - sensitive_info_leak: API key / secret / .env-like pattern detection
 *
 * Custom rules: user の `yuino.config.yml` boundary.custom_rules で declare、本 module で audit
 * Premium boundary templates: templates/boundary/<name>.boundary.yml から custom_rules merge (config-loader.ts で resolve 済)
 */

import type { BoundaryConfig, BoundaryRule, BoundaryAction } from './config.js';

// === Audit result types ===

export interface BoundaryViolation {
  rule_id: string;
  monitor_type: 'scope_creep' | 'sensitive_info_leak' | 'custom';
  action: BoundaryAction;
  message: string;
  matched_text?: string; // optional: matched substring (for debugging / audit log)
}

export interface BoundaryAuditResult {
  passed: boolean;
  violations: BoundaryViolation[];
  warnings: BoundaryViolation[]; // action: warn の violations
  blocked: BoundaryViolation[]; // action: deny の violations
  logged: BoundaryViolation[]; // action: log の violations
}

// === Builtin: scope_creep ===

const DEFAULT_SCOPE_CREEP_PATTERNS: Array<{ pattern: RegExp; rule_id: string; message: string }> = [
  // External outbound communication
  {
    pattern: /\b(send_email|send_to_customer|send_to_client|outreach_email|cold_email)\b/i,
    rule_id: 'scope_creep_external_send',
    message: 'External outbound communication detected — outside digest-only scope',
  },
  // State mutation (production / external services)
  {
    pattern: /\b(mutate_(production|prod|wsd|business)_state|approve_contract|sign_contract|execute_agreement)\b/i,
    rule_id: 'scope_creep_state_mutation',
    message: 'External state mutation detected — outside digest-only scope',
  },
  // Pricing / financial commitment
  {
    pattern: /\b(change_price|commit_spend|approve_spend|publish_pricing|pricing_change)\b/i,
    rule_id: 'scope_creep_financial_commit',
    message: 'Financial commitment action detected — outside digest-only scope',
  },
  // Lead / sales action
  {
    pattern: /\b(contact_lead|mark_packet_sent|approve_lead|qualify_lead)\b/i,
    rule_id: 'scope_creep_sales_action',
    message: 'Sales action detected — outside digest-only scope',
  },
  // Public publish action
  {
    pattern: /\b(publish_content|publish_to_(zenn|booth|gumroad|x|note)|deploy_to_prod)\b/i,
    rule_id: 'scope_creep_public_publish',
    message: 'Public publish action detected — outside digest-only scope',
  },
];

function auditScopeCreep(text: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const { pattern, rule_id, message } of DEFAULT_SCOPE_CREEP_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        rule_id,
        monitor_type: 'scope_creep',
        action: 'deny',
        message,
        matched_text: match[0],
      });
    }
  }
  return violations;
}

// === Builtin: sensitive_info_leak ===

const DEFAULT_SENSITIVE_INFO_PATTERNS: Array<{ pattern: RegExp; rule_id: string; message: string; action?: BoundaryAction }> = [
  // API keys (common forms)
  {
    pattern: /\b(sk-[a-zA-Z0-9]{20,}|sk_[a-zA-Z0-9]{20,})\b/,
    rule_id: 'sensitive_api_key_sk_prefix',
    message: 'API key with sk- / sk_ prefix detected (Anthropic / OpenAI / Stripe / etc.)',
    action: 'deny',
  },
  // OAuth tokens
  {
    pattern: /\b(ghp_[a-zA-Z0-9]{20,}|ghs_[a-zA-Z0-9]{20,}|github_pat_[a-zA-Z0-9_]{20,})\b/,
    rule_id: 'sensitive_github_token',
    message: 'GitHub personal access token / OAuth token detected',
    action: 'deny',
  },
  // AWS credentials
  {
    pattern: /\b(AKIA[A-Z0-9]{16}|ASIA[A-Z0-9]{16})\b/,
    rule_id: 'sensitive_aws_access_key',
    message: 'AWS access key detected',
    action: 'deny',
  },
  // Private key headers
  {
    pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH |PRIVATE )(PRIVATE )?KEY-----/,
    rule_id: 'sensitive_private_key',
    message: 'Private key block detected',
    action: 'deny',
  },
  // .env-like patterns (KEY=VALUE with secret-looking name)
  {
    pattern: /\b(SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|CREDENTIALS)[\s=:]+["']?[a-zA-Z0-9_\-+/=]{16,}/,
    rule_id: 'sensitive_env_pattern',
    message: 'Secret-looking KEY=VALUE pattern detected (.env style)',
    action: 'warn',
  },
  // JWT tokens
  {
    pattern: /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/,
    rule_id: 'sensitive_jwt',
    message: 'JWT token pattern detected',
    action: 'warn',
  },
];

function auditSensitiveInfoLeak(text: string): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const { pattern, rule_id, message, action } of DEFAULT_SENSITIVE_INFO_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      violations.push({
        rule_id,
        monitor_type: 'sensitive_info_leak',
        action: action ?? 'deny',
        message,
        matched_text: match[0],
      });
    }
  }
  return violations;
}

// === Custom rules audit ===

function auditCustomRules(text: string, rules: BoundaryRule[]): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const rule of rules) {
    let regex: RegExp;
    try {
      regex = new RegExp(rule.pattern, 'i');
    } catch (err) {
      // Invalid regex pattern in custom rule — log warning, skip
      violations.push({
        rule_id: `${rule.id}_INVALID_PATTERN`,
        monitor_type: 'custom',
        action: 'log',
        message: `Custom rule "${rule.id}" has invalid regex pattern: ${rule.pattern}`,
      });
      continue;
    }

    const match = text.match(regex);
    if (match) {
      violations.push({
        rule_id: rule.id,
        monitor_type: 'custom',
        action: rule.action,
        message: rule.message ?? `Custom rule "${rule.id}" matched`,
        matched_text: match[0],
      });
    }
  }
  return violations;
}

// === Composite audit ===

/**
 * Run boundary audit on text using user-configured monitor types + custom rules.
 *
 * @param text content to audit (e.g., digest output before write)
 * @param boundaryConfig validated boundary config (post config-loader.ts)
 * @returns audit result with violations grouped by action
 */
export function auditOutput(text: string, boundaryConfig: BoundaryConfig): BoundaryAuditResult {
  const allViolations: BoundaryViolation[] = [];

  // Builtin monitor types
  if (boundaryConfig.monitor_types.includes('scope_creep')) {
    allViolations.push(...auditScopeCreep(text));
  }
  if (boundaryConfig.monitor_types.includes('sensitive_info_leak')) {
    allViolations.push(...auditSensitiveInfoLeak(text));
  }

  // Custom rules (includes premium template rules merged via config-loader)
  if (boundaryConfig.custom_rules.length > 0) {
    allViolations.push(...auditCustomRules(text, boundaryConfig.custom_rules));
  }

  // Group by action
  const blocked = allViolations.filter((v) => v.action === 'deny');
  const warnings = allViolations.filter((v) => v.action === 'warn');
  const logged = allViolations.filter((v) => v.action === 'log');

  return {
    passed: blocked.length === 0,
    violations: allViolations,
    warnings,
    blocked,
    logged,
  };
}

// === Helpers for digest integration ===

/**
 * Format a single violation for digest contradiction note inclusion.
 * Used when boundary audit produces violations and they should appear in the digest output.
 */
export function formatViolationForContradictionNote(violation: BoundaryViolation): string {
  const severityMap: Record<BoundaryAction, string> = {
    deny: '🔴 Red',
    warn: '🟡 Yellow',
    log: '🟢 Green',
  };
  const severity = severityMap[violation.action];
  return `${severity} **boundary violation [${violation.rule_id}]**: ${violation.message}`;
}

/**
 * Compose audit summary for digest meta section.
 */
export function formatAuditSummary(result: BoundaryAuditResult): string {
  const lines: string[] = [];
  lines.push(`- boundary_audit_passed: ${result.passed}`);
  lines.push(`- violations_total: ${result.violations.length}`);
  if (result.blocked.length > 0) lines.push(`- blocked: ${result.blocked.length}`);
  if (result.warnings.length > 0) lines.push(`- warnings: ${result.warnings.length}`);
  if (result.logged.length > 0) lines.push(`- logged: ${result.logged.length}`);
  return lines.join('\n');
}
