'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InboxItem } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ApproveCardProps {
  inboxItem: InboxItem;
}

type Mode = 'view' | 'edit';

type Decision = 'approve' | 'modify' | 'reject';

export function ApproveCard({ inboxItem }: ApproveCardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('view');
  const [editBody, setEditBody] = useState(inboxItem.body);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function postDecision(decision: Decision, payload: Record<string, unknown> = {}) {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/v1/inbox/${encodeURIComponent(inboxItem.filename)}/decide`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision, ...payload }),
        },
      );
      if (!res.ok) {
        const text = await safeReadText(res);
        setErrorMsg(`送信失敗 (${res.status}) ${text}`);
        return;
      }
      setMode('view');
      router.refresh();
    } catch (err) {
      setErrorMsg(`通信エラー: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-zinc-100 break-all">
              {inboxItem.subject || inboxItem.filename}
            </CardTitle>
            <CardDescription className="text-zinc-500">
              <span className="text-zinc-400">{inboxItem.from || '不明'}</span>
              <span className="text-zinc-600 mx-1.5">{'→'}</span>
              <span className="text-zinc-400">{inboxItem.to || '-'}</span>
              <span className="text-zinc-600 mx-1.5">/</span>
              <span>{inboxItem.date || '日付不明'}</span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {inboxItem.priority && (
              <Badge variant="secondary">優先度 {inboxItem.priority}</Badge>
            )}
            {inboxItem.deadline && (
              <span className="text-xs text-zinc-600">
                期限 {inboxItem.deadline}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {mode === 'view' ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 break-all">
              file: {inboxItem.filename}
            </p>
            <pre className="max-h-64 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {truncate(inboxItem.body, 1200)}
            </pre>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs text-zinc-400">
              本文 (修正)
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="mt-1 block w-full min-h-48 rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 leading-relaxed"
                disabled={submitting}
              />
            </label>
            <label className="block text-xs text-zinc-400">
              修正理由 (任意)
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例: 文言調整 + 期限延長"
                className="mt-1 block w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200"
                disabled={submitting}
              />
            </label>
          </div>
        )}

        {errorMsg && (
          <p className="mt-3 text-xs text-red-400 break-all">{errorMsg}</p>
        )}
      </CardContent>

      <CardFooter>
        {mode === 'view' ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={() => postDecision('reject')}
            >
              却下
            </Button>
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => {
                setEditBody(inboxItem.body);
                setReason('');
                setErrorMsg(null);
                setMode('edit');
              }}
            >
              修正
            </Button>
            <Button
              variant="default"
              disabled={submitting}
              onClick={() => postDecision('approve')}
            >
              承認
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              disabled={submitting}
              onClick={() => {
                setMode('view');
                setErrorMsg(null);
              }}
            >
              キャンセル
            </Button>
            <Button
              variant="default"
              disabled={submitting}
              onClick={() =>
                postDecision('modify', {
                  modified_body: editBody,
                  reason: reason || undefined,
                })
              }
            >
              修正を保存
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n... (省略 ${text.length - max} 文字)`;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return '';
  }
}
