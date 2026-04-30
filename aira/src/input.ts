/**
 * input.ts — Aira read scope 管理
 *
 * Kai recommend (2026-04-28) 厳守:
 *   - kai_owner_digest.md
 *   - kai_status.md
 *   - zen_status.md
 *   - recent board messages (直近 3 日)
 *   - relevant inbox/status files
 *
 * Aira は WSD business state を直接読まない。
 * Kai が提供する kai_owner_digest.md / kai_status.md を経由する。
 */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join } from "path";

// --- Path constants ---

const SHARED_OPS = "C:/Users/jk023/.shared-ops";
const STATUS_DIR = join(SHARED_OPS, "status");
const BOARD_DIR = join(SHARED_OPS, "board");
const INBOX_DIR = join(SHARED_OPS, "inbox");

/** 許可された read source パスプレフィックス (scope boundary) */
const ALLOWED_READ_PREFIXES = [
  STATUS_DIR,
  BOARD_DIR,
  INBOX_DIR,
] as const;

export interface ReadResult {
  path: string;
  content: string;
  source: "kai_owner_digest" | "kai_status" | "zen_status" | "board" | "inbox";
}

export interface ReadError {
  path: string;
  error: string;
}

/**
 * 指定パスが許可された read scope 内かチェックする。
 * scope 外は DENY。
 */
export function isInReadScope(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return ALLOWED_READ_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix.replace(/\\/g, "/"))
  );
}

function safeRead(filePath: string): string | null {
  if (!isInReadScope(filePath)) {
    throw new Error(
      `Read scope violation: "${filePath}" is outside Aira allowed read scope`
    );
  }
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

/** kai_owner_digest.md を読む */
export function readKaiOwnerDigest(): ReadResult | ReadError {
  const path = join(STATUS_DIR, "kai_owner_digest.md");
  const content = safeRead(path);
  if (!content)
    return { path, error: "kai_owner_digest.md not found" };
  return { path, content, source: "kai_owner_digest" };
}

/** kai_status.md を読む */
export function readKaiStatus(): ReadResult | ReadError {
  const path = join(STATUS_DIR, "kai_status.md");
  const content = safeRead(path);
  if (!content)
    return { path, error: "kai_status.md not found" };
  return { path, content, source: "kai_status" };
}

/** zen_status.md を読む */
export function readZenStatus(): ReadResult | ReadError {
  const path = join(STATUS_DIR, "zen_status.md");
  const content = safeRead(path);
  if (!content)
    return { path, error: "zen_status.md not found" };
  return { path, content, source: "zen_status" };
}

/**
 * board/ から直近 N 日のファイルを読む
 * date prefix YYYY-MM-DD で sort、新しいものから取得
 */
export function readRecentBoardMessages(
  daysBack: number = 3
): (ReadResult | ReadError)[] {
  if (!existsSync(BOARD_DIR)) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

  const files = readdirSync(BOARD_DIR)
    .filter((f) => f.endsWith(".md") && f >= cutoffStr)
    .sort()
    .reverse()
    .slice(0, 20); // 最大 20 件

  return files.map((f) => {
    const fullPath = join(BOARD_DIR, f);
    const content = safeRead(fullPath);
    if (!content)
      return { path: fullPath, error: `board file not readable: ${f}` };
    return { path: fullPath, content, source: "board" as const };
  });
}

/**
 * inbox/ から relevant ファイルを読む
 * 直近 N 日のもの
 */
export function readRelevantInbox(
  daysBack: number = 3
): (ReadResult | ReadError)[] {
  if (!existsSync(INBOX_DIR)) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const files = readdirSync(INBOX_DIR)
    .filter((f) => f.endsWith(".md") && f >= cutoffStr)
    .sort()
    .reverse()
    .slice(0, 10);

  return files.map((f) => {
    const fullPath = join(INBOX_DIR, f);
    const content = safeRead(fullPath);
    if (!content)
      return { path: fullPath, error: `inbox file not readable: ${f}` };
    return { path: fullPath, content, source: "inbox" as const };
  });
}

export function isReadResult(r: ReadResult | ReadError): r is ReadResult {
  return "content" in r;
}

/**
 * 全 input source を収集して返す (mock 用: 失敗は error 記録して続行)
 */
export interface InputCollection {
  kaiOwnerDigest: ReadResult | ReadError;
  kaiStatus: ReadResult | ReadError;
  zenStatus: ReadResult | ReadError;
  boardMessages: (ReadResult | ReadError)[];
  inboxItems: (ReadResult | ReadError)[];
  collectedAt: string;
}

export function collectAllInputs(opts?: {
  boardDaysBack?: number;
  inboxDaysBack?: number;
}): InputCollection {
  const boardDaysBack = opts?.boardDaysBack ?? 3;
  const inboxDaysBack = opts?.inboxDaysBack ?? 3;

  return {
    kaiOwnerDigest: readKaiOwnerDigest(),
    kaiStatus: readKaiStatus(),
    zenStatus: readZenStatus(),
    boardMessages: readRecentBoardMessages(boardDaysBack),
    inboxItems: readRelevantInbox(inboxDaysBack),
    collectedAt: new Date().toISOString(),
  };
}
