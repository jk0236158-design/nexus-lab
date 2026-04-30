/**
 * boundary.ts — Aira identity 監視対象 #9-11 物理ガード
 *
 * 監視対象:
 *   #9  naming split drift  — public surface に "Aira" 漏出 0 件
 *   #10 scope creep         — Phase 1/2 役割超過 (outbound / price / contract) を提案しない
 *   #11 secretary overlap   — dormant 維持、active 化 trigger なし
 *
 * このモジュールは 3 つの ALLOW/DENY 関数を export する。
 * 各関数は呼び出し元 (digest.ts / output.ts) が自己 audit に使う。
 */

// --- #9 Naming Split Drift ---

/** public surface に出してはいけない Aira 固有識別子 */
const AIRA_PUBLIC_IDENTIFIERS = [
  "Aira",
  "aira",
  "AIRA",
] as const;

/** 公開先と判定するキーワード */
const PUBLIC_SURFACE_MARKERS = [
  "zenn",
  "README",
  "brand",
  "description",
  "外向き",
  "public",
  "npm",
  "gumroad",
  "booth",
] as const;

export type NamingSplitResult =
  | { allowed: true }
  | { allowed: false; reason: string; violation: string };

/**
 * テキストが public surface に Aira 識別子を含む場合 DENY を返す。
 *
 * @param text      出力候補テキスト
 * @param surface   出力先識別子 (例: "zenn_article", "internal_board")
 */
export function checkNamingSplit(
  text: string,
  surface: string
): NamingSplitResult {
  const isPublic = PUBLIC_SURFACE_MARKERS.some((m) =>
    surface.toLowerCase().includes(m.toLowerCase())
  );
  if (!isPublic) return { allowed: true };

  for (const id of AIRA_PUBLIC_IDENTIFIERS) {
    if (text.includes(id)) {
      return {
        allowed: false,
        reason: `#9 naming split drift: "${id}" detected on public surface "${surface}"`,
        violation: id,
      };
    }
  }
  return { allowed: true };
}

// --- #10 Scope Creep ---

/** Phase 0 で禁止されているアクション種別 */
const SCOPE_CREEP_ACTIONS = [
  "send_email",
  "change_price",
  "contact_lead",
  "mark_packet_sent",
  "mutate_wsd_state",
  "approve_contract",
  "commit_spend",
  "publish_content",
] as const;

export type ScopeCreepAction = (typeof SCOPE_CREEP_ACTIONS)[number];

export type ScopeCreepResult =
  | { allowed: true }
  | { allowed: false; reason: string; action: ScopeCreepAction };

/**
 * 要求されたアクションが Aira Phase 0 の scope 内かチェックする。
 * Aira は digest / contradiction notes / WAIT obs のみ出力可能。
 */
export function checkScopeCreep(
  requestedAction: string
): ScopeCreepResult {
  const match = SCOPE_CREEP_ACTIONS.find(
    (a) => requestedAction.toLowerCase().includes(a.replace(/_/g, " ")) ||
      requestedAction === a
  );
  if (match) {
    return {
      allowed: false,
      reason: `#10 scope creep: action "${requestedAction}" exceeds Phase 0 boundary. Aira outputs digest/contradiction/WAIT only.`,
      action: match,
    };
  }
  return { allowed: true };
}

/** Aira Phase 0 で許可される出力種別 */
export const ALLOWED_OUTPUT_TYPES = [
  "digest",
  "contradiction_note",
  "wait_observation",
] as const;

export type AllowedOutputType = (typeof ALLOWED_OUTPUT_TYPES)[number];

export function isAllowedOutputType(
  outputType: string
): outputType is AllowedOutputType {
  return ALLOWED_OUTPUT_TYPES.includes(outputType as AllowedOutputType);
}

// --- #11 Secretary Overlap ---

/** Secretary 役割と判定するキーワード */
const SECRETARY_PATTERNS = [
  "schedule.*meeting",
  "remind.*tomorrow",
  "send.*on.*behalf",
  "draft.*email.*jun",
  "manage.*calendar",
  "track.*appointments",
] as const;

export type SecretaryOverlapResult =
  | { allowed: true }
  | { allowed: false; reason: string; pattern: string };

/**
 * 出力内容が secretary 役割 (dormant、active 化 trigger なし) に踏み込んでいないかチェックする。
 * #11 secretary overlap 監視対象。
 */
export function checkSecretaryOverlap(
  outputContent: string
): SecretaryOverlapResult {
  for (const pattern of SECRETARY_PATTERNS) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(outputContent)) {
      return {
        allowed: false,
        reason: `#11 secretary overlap: output matches secretary pattern "${pattern}". Aira secretary role is dormant.`,
        pattern,
      };
    }
  }
  return { allowed: true };
}

// --- composite audit ---

export interface BoundaryAuditResult {
  passed: boolean;
  violations: string[];
}

/**
 * 3 監視対象を一括でチェックする composite audit。
 * digest.ts / output.ts の出力前に呼び出す。
 */
export function auditOutput(params: {
  text: string;
  surface: string;
  requestedAction: string;
  outputType: string;
}): BoundaryAuditResult {
  const violations: string[] = [];

  const naming = checkNamingSplit(params.text, params.surface);
  if (!naming.allowed) violations.push(naming.reason);

  const scope = checkScopeCreep(params.requestedAction);
  if (!scope.allowed) violations.push(scope.reason);

  const secretary = checkSecretaryOverlap(params.text);
  if (!secretary.allowed) violations.push(secretary.reason);

  if (!isAllowedOutputType(params.outputType)) {
    violations.push(
      `#10 scope creep: output_type "${params.outputType}" is not in ALLOWED_OUTPUT_TYPES`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
