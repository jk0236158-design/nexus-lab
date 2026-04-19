import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { z } from 'zod';

// ─── 定数 ───────────────────────────────────────────────────────────────────

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH ||
  path.join(os.homedir(), '.shared-ops');

const BOARD_DIR = path.join(SHARED_OPS_PATH, 'board');

// 宛先定義（UI 表示は大文字始まり。ファイル名・frontmatter は小文字）
const VALID_DESTINATIONS = [
  'Kai', 'Zen',
  'Iwa', 'Oto', 'Akari', 'Kagami', 'Hoshi', 'Kura',
] as const;
type Destination = (typeof VALID_DESTINATIONS)[number];

/** Pattern C の直接 dispatch 対象 */
const DIRECT_TARGETS: ReadonlySet<Destination> = new Set(['Kai', 'Zen'] as const);

const VALID_KINDS = ['相談', '指示', '雑談', '報告'] as const;
type Kind = (typeof VALID_KINDS)[number];

// Akari 合意: 相談→consultation, 指示→instruction, 雑談→casual, 報告→report
const KIND_TO_EN: Record<Kind, string> = {
  相談: 'consultation',
  指示: 'instruction',
  雑談: 'casual',
  報告: 'report',
};

/** 機微情報の検知パターン（warn only、reject しない） */
const SENSITIVE_PATTERNS: RegExp[] = [
  /\b(?:sk-|sk-ant-|ghp_|xoxb-)\S+/i,          // API key prefix
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/,   // カード番号
  /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/i,     // password=xxx
  /\b\+?\d[\d\s-]{8,}\d\b/,                      // 電話番号
];

// ─── Zod スキーマ (Akari I/F 合意値に準拠) ──────────────────────────────────

const ChatRequestSchema = z.object({
  to: z.enum(VALID_DESTINATIONS as unknown as [Destination, ...Destination[]]),
  kind: z.enum(VALID_KINDS as unknown as [Kind, ...Kind[]]),
  /** 件名: 1〜100文字 (Akari 合意) */
  subject: z.string().min(1, '件名は必須です').max(100, '件名は100文字以内'),
  /** 本文: 1〜2000文字 (Akari 合意) */
  body: z.string().min(1, '本文は必須です').max(2000, '本文は2,000文字以内'),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ─── レスポンス型 ─────────────────────────────────────────────────────────────

export interface ChatResponse {
  ok: true;
  filename: string;
  absolutePath: string;
}

export interface ChatErrorResponse {
  ok: false;
  error: string;
  details?: unknown;
}

// ─── slug 生成 ───────────────────────────────────────────────────────────────

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s　]+/g, '_')           // 空白→アンダースコア
    .replace(/[^\w]/g, '')              // 英数・アンダースコア以外を除去
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
    || 'msg';
}

function todayDateString(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── ルーティング判定 ─────────────────────────────────────────────────────────

function resolveFilename(to: Destination, subject: string): string {
  const date = todayDateString();
  const slug = toSlug(subject);
  const toLower = to.toLowerCase();

  if (DIRECT_TARGETS.has(to)) {
    // Kai / Zen 直接: YYYY-MM-DD_owner_{kai|zen}_{slug}.md
    return `${date}_owner_${toLower}_${slug}.md`;
  } else {
    // Zen チームメンバー宛: YYYY-MM-DD_owner_zen_request_to_{member}_{slug}.md
    return `${date}_owner_zen_request_to_${toLower}_${slug}.md`;
  }
}

// ─── Markdown 本文生成 ────────────────────────────────────────────────────────

function buildMarkdown(req: ChatRequest, date: string): string {
  const kindEn = KIND_TO_EN[req.kind as Kind];
  const isDirect = DIRECT_TARGETS.has(req.to);
  const toFm = isDirect ? req.to.toLowerCase() : 'zen';
  const requestedAgent = isDirect ? null : req.to.toLowerCase();

  const frontmatterLines: string[] = [
    '---',
    'from: owner',
    `to: ${toFm}`,
    ...(requestedAgent ? [`requested_agent: ${requestedAgent}`] : []),
    `kind: ${kindEn}`,
    `date: ${date}`,
    `topic: ${req.subject}`,
    'source: ops-console-chat',
    '---',
  ];

  const headerLines: string[] = [
    '# From: Owner',
    `# To: ${toFm}`,
    ...(requestedAgent ? [`# Requested-Agent: ${req.to}`] : []),
    `# Kind: ${req.kind} (${kindEn})`,
    `# Subject: ${req.subject}`,
    '',
    req.body,
  ];

  return [...frontmatterLines, '', ...headerLines].join('\n') + '\n';
}

// ─── 機微情報スキャン ─────────────────────────────────────────────────────────

function detectSensitive(text: string): string[] {
  const hits: string[] = [];
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(text)) {
      hits.push(String(pattern).slice(0, 40));
    }
  }
  return hits;
}

// ─── atomic write (tempfile + rename) ────────────────────────────────────────

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.writeFile(tmpPath, content, { encoding: 'utf-8', flag: 'w' });
    await fs.rename(tmpPath, filePath);
  } catch (err) {
    await fs.unlink(tmpPath).catch(() => undefined);
    throw err;
  }
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ChatResponse | ChatErrorResponse>> {
  // 1. body parse
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body' } satisfies ChatErrorResponse,
      { status: 400 },
    );
  }

  // 2. Zod validate
  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      } satisfies ChatErrorResponse,
      { status: 422 },
    );
  }

  const req = parsed.data;

  // 3. 機微情報検知 (warn only — UX 原則: ユーザーを信頼)
  const sensitiveHits = detectSensitive(req.subject + ' ' + req.body);
  if (sensitiveHits.length > 0) {
    console.warn('[chat/route] Sensitive pattern detected in message:', sensitiveHits);
  }

  // 4. filename 決定 & パス構築
  const date = todayDateString();
  const filename = resolveFilename(req.to as Destination, req.subject);
  const absolutePath = path.join(BOARD_DIR, filename);

  // 5. Markdown 生成 & atomic write
  const markdown = buildMarkdown(req, date);
  try {
    await atomicWrite(absolutePath, markdown);
  } catch (err) {
    console.error('[chat/route] Write error:', err);
    return NextResponse.json(
      { ok: false, error: 'メッセージの書き込みに失敗しました' } satisfies ChatErrorResponse,
      { status: 500 },
    );
  }

  // 6. 結果返却 (Akari 合意: ok:true + filename)
  return NextResponse.json(
    { ok: true, filename, absolutePath } satisfies ChatResponse,
    { status: 201 },
  );
}
