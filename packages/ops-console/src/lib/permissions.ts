// Yuino セキュリティ v0 axis 19: Permission model (5/07 PM jun directive 「絶対妥協なし」)
// 「読むだけ / 下書き / ローカル実行 / 外部実行 の 4 段」 = Read / Draft / Internal Execute / External Execute
// Approval Gate boundary (北極星 「jun 介入週 1-2 回」 と balance):
//   - Read: 自動許可
//   - Draft: 自動許可 (但し公開不可、 draft state のみ)
//   - Internal Execute: whitelist 自動許可
//   - External Execute: 必ず jun 確認

export type PermissionLevel =
  | 'read'
  | 'draft'
  | 'internal-execute'
  | 'external-execute';

export interface PermissionCheckResult {
  allowed: boolean;
  level: PermissionLevel;
  requiresJunApproval: boolean;
  reason?: string;
}

/**
 * Permission level boundary 判定。
 * - read / draft: 自動許可
 * - internal-execute: whitelist 自動許可
 * - external-execute: jun 確認必須 (allowed=false、 inbox 経由で approval gate へ)
 */
export function checkPermission(
  level: PermissionLevel,
  context?: {
    /** Internal Execute の whitelist matched flag (caller が判定) */
    internalExecuteWhitelisted?: boolean;
    /** override flag (jun manual approval、 axis 10 Approval Gate decide POST 経由) */
    junApproved?: boolean;
  },
): PermissionCheckResult {
  switch (level) {
    case 'read':
      return {
        allowed: true,
        level,
        requiresJunApproval: false,
      };

    case 'draft':
      return {
        allowed: true,
        level,
        requiresJunApproval: false,
        reason: 'draft state のみ、 公開不可',
      };

    case 'internal-execute': {
      const whitelisted = context?.internalExecuteWhitelisted ?? false;
      return {
        allowed: whitelisted,
        level,
        requiresJunApproval: !whitelisted,
        reason: whitelisted
          ? 'Internal Execute whitelisted'
          : 'Internal Execute non-whitelist、 jun 確認必須',
      };
    }

    case 'external-execute': {
      const approved = context?.junApproved ?? false;
      return {
        allowed: approved,
        level,
        requiresJunApproval: !approved,
        reason: approved
          ? 'External Execute jun 承認済'
          : 'External Execute は必ず jun 確認 (Approval Gate axis 10 経由)',
      };
    }
  }
}

/**
 * Internal Execute whitelist 判定。
 * v0 minimum viable: ~/.shared-ops/board/ + inbox/ + status/ への atomic write は許可。
 * Polar.sh 操作 / 公開 publish / 支払い / 契約 / 価格変更 / 公開設定変更 は NOT internal、 external-execute level。
 */
export function isInternalExecuteWhitelisted(action: string): boolean {
  const whitelist = [
    'board.write', // board/ への atomic write
    'inbox.write', // inbox/ への atomic write
    'inbox.decide', // inbox status update (但し decide 自体は External Execute target file の type による)
    'decisions.write', // owner-decisions/ への atomic write (jun 直接起稿のみ)
    'status.write', // status/ への atomic write
    'audit.append', // audit log append
  ];
  return whitelist.includes(action);
}

/**
 * Endpoint metadata 取得 (route handler が export する permission level)。
 * v0 では convention base、 endpoint で `export const permissionLevel: PermissionLevel = '...'` を export。
 */
export interface EndpointMetadata {
  permissionLevel: PermissionLevel;
  action: string;
}
