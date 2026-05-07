import { NextRequest, NextResponse } from 'next/server';
import { promises as fs, existsSync } from 'fs';
import { join, basename } from 'path';
import { z } from 'zod';
import { appendAuditLog } from '@/lib/data/audit-log';
import {
  checkPermission,
  type PermissionLevel,
} from '@/lib/permissions';

// Yuino セキュリティ v0 axis 10: Approval Gate API endpoint
// 「外部に出す前に必ずあなたが OK 押す」 = inbox pending item に対する jun 1 click 判断
// Permission level: external-execute (但し inbox.decide 自体は internal-execute、
// 実際の external action は decide 後の別 endpoint で trigger される form)

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const permissionLevel: PermissionLevel = 'internal-execute';
export const action = 'inbox.decide';

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || 'C:\\Users\\jk023\\.shared-ops';

const InboxDecideRequestSchema = z.object({
  decision: z.enum(['approve', 'modify', 'reject']),
  reason: z.string().max(2000).optional(),
  modified_body: z.string().max(50000).optional(),
});

export interface InboxDecideSuccess {
  ok: true;
  decision: 'approve' | 'modify' | 'reject';
  filename: string;
  decidedAt: string;
}

export interface InboxDecideError {
  ok: false;
  error: string;
}

/**
 * atomic write retry (Kai commit bbfa50b reflected pattern)
 * EPERM/EBUSY/ENOENT/EACCES の 4 error で exp backoff + jitter、 max 5 retry
 */
async function atomicWriteWithRetry(
  filePath: string,
  content: string,
  opts = { maxRetries: 5, baseDelayMs: 50 },
): Promise<void> {
  const dir = join(filePath, '..');
  const tmpPath = join(
    dir,
    `.tmp_${Date.now()}_${process.pid}_${Math.random().toString(36).slice(2, 10)}`,
  );

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmpPath, content, { encoding: 'utf-8' });

  let lastErr: NodeJS.ErrnoException | undefined;
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      await fs.rename(tmpPath, filePath);
      return;
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      lastErr = e;
      if (!['EPERM', 'EBUSY', 'ENOENT', 'EACCES'].includes(e.code ?? '')) {
        await fs.unlink(tmpPath).catch(() => {});
        throw err;
      }
      const delay = opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 50;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  await fs.unlink(tmpPath).catch(() => {});
  throw lastErr;
}

function isFilenameSafe(filename: string): boolean {
  if (filename.includes('..')) return false;
  if (filename.includes('/')) return false;
  if (filename.includes('\\')) return false;
  if (!filename.endsWith('.md')) return false;
  return true;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> },
): Promise<NextResponse<InboxDecideSuccess | InboxDecideError>> {
  const { filename } = await context.params;

  // path traversal ガード
  if (!isFilenameSafe(filename)) {
    appendAuditLog({
      action: 'inbox.decide',
      endpoint: `/api/v1/inbox/${filename}/decide`,
      method: 'POST',
      affected_files: [],
      user_identity: 'jun',
      request_summary: `path traversal reject: ${filename}`,
      response_status: 400,
      permission_level: permissionLevel,
    });
    return NextResponse.json(
      { ok: false, error: 'invalid filename (path traversal protection)' },
      { status: 400 },
    );
  }

  // request body parse
  let body: z.infer<typeof InboxDecideRequestSchema>;
  try {
    const json = await request.json();
    body = InboxDecideRequestSchema.parse(json);
  } catch (err) {
    appendAuditLog({
      action: 'inbox.decide',
      endpoint: `/api/v1/inbox/${filename}/decide`,
      method: 'POST',
      affected_files: [],
      user_identity: 'jun',
      request_summary: 'request body parse error',
      response_status: 400,
      permission_level: permissionLevel,
    });
    return NextResponse.json(
      { ok: false, error: `invalid request body: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  // permission check
  const permission = checkPermission(permissionLevel, {
    internalExecuteWhitelisted: true, // inbox.decide は whitelist
  });
  if (!permission.allowed) {
    appendAuditLog({
      action: 'inbox.decide',
      endpoint: `/api/v1/inbox/${filename}/decide`,
      method: 'POST',
      affected_files: [],
      user_identity: 'jun',
      request_summary: `permission denied: ${permission.reason}`,
      response_status: 403,
      permission_level: permissionLevel,
    });
    return NextResponse.json(
      { ok: false, error: `permission denied: ${permission.reason}` },
      { status: 403 },
    );
  }

  const inboxPath = join(SHARED_OPS_PATH, 'inbox', filename);
  if (!existsSync(inboxPath)) {
    appendAuditLog({
      action: 'inbox.decide',
      endpoint: `/api/v1/inbox/${filename}/decide`,
      method: 'POST',
      affected_files: [inboxPath],
      user_identity: 'jun',
      request_summary: 'inbox file not found',
      response_status: 404,
      permission_level: permissionLevel,
    });
    return NextResponse.json(
      { ok: false, error: 'inbox file not found' },
      { status: 404 },
    );
  }

  // 既存 inbox content read + frontmatter status update
  let originalContent = '';
  try {
    originalContent = await fs.readFile(inboxPath, 'utf-8');
  } catch (err) {
    appendAuditLog({
      action: 'inbox.decide',
      endpoint: `/api/v1/inbox/${filename}/decide`,
      method: 'POST',
      affected_files: [inboxPath],
      user_identity: 'jun',
      request_summary: `read error: ${(err as Error).message}`,
      response_status: 500,
      permission_level: permissionLevel,
    });
    return NextResponse.json(
      { ok: false, error: `read error: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  const decidedAt = new Date().toISOString();
  const statusValue =
    body.decision === 'approve'
      ? 'approved'
      : body.decision === 'modify'
        ? 'modified'
        : 'rejected';

  // frontmatter status update + decision metadata 追記
  const updatedContent = updateFrontmatterStatus(originalContent, {
    status: statusValue,
    decided_at: decidedAt,
    decision: body.decision,
    decision_reason: body.reason ?? '',
  });

  // modify の場合は body も更新
  const finalContent =
    body.decision === 'modify' && body.modified_body
      ? replaceBody(updatedContent, body.modified_body)
      : updatedContent;

  try {
    await atomicWriteWithRetry(inboxPath, finalContent);
  } catch (err) {
    appendAuditLog({
      action: 'inbox.decide',
      endpoint: `/api/v1/inbox/${filename}/decide`,
      method: 'POST',
      affected_files: [inboxPath],
      user_identity: 'jun',
      request_summary: `atomic write failed: ${(err as Error).message}`,
      response_status: 500,
      permission_level: permissionLevel,
    });
    return NextResponse.json(
      { ok: false, error: `atomic write failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  // audit log: 成功
  appendAuditLog({
    action: 'inbox.decide',
    endpoint: `/api/v1/inbox/${filename}/decide`,
    method: 'POST',
    affected_files: [inboxPath],
    user_identity: 'jun',
    request_summary: `decision=${body.decision} reason=${body.reason ? '<provided>' : '<none>'}`,
    response_status: 200,
    permission_level: permissionLevel,
    evidence: `decided_at=${decidedAt}`,
  });

  return NextResponse.json(
    { ok: true, decision: body.decision, filename, decidedAt },
    { status: 200 },
  );
}

function updateFrontmatterStatus(
  content: string,
  updates: Record<string, string>,
): string {
  // frontmatter (--- ~ ---) を parse + update。 不在なら frontmatter 新規追加
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    // frontmatter 不在 → 新規追加
    const fmLines = Object.entries(updates).map(([k, v]) => `${k}: ${v}`);
    return `---\n${fmLines.join('\n')}\n---\n\n${content}`;
  }

  const fmRaw = match[1];
  const body = match[2];

  // 既存 key を update、 新規 key を append
  const lines = fmRaw.split('\n');
  const existingKeys = new Set<string>();
  const updatedLines = lines.map((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return line;
    const key = line.slice(0, colonIdx).trim();
    if (key in updates) {
      existingKeys.add(key);
      return `${key}: ${updates[key]}`;
    }
    return line;
  });

  // 新規 key (existingKeys に含まれない updates key) を append
  for (const [key, value] of Object.entries(updates)) {
    if (!existingKeys.has(key)) {
      updatedLines.push(`${key}: ${value}`);
    }
  }

  return `---\n${updatedLines.join('\n')}\n---\n${body}`;
}

function replaceBody(content: string, newBody: string): string {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (!match) {
    return newBody;
  }
  return `---\n${match[1]}\n---\n${newBody}`;
}
