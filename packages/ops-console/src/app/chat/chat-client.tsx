'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type {
  ChatRecipient,
  ChatKind,
  ChatSendResponse,
  ChatSendErrorResponse,
} from '@/lib/types';

// ---- 定数 ----

const RECIPIENTS: ChatRecipient[] = [
  'Kai',
  'Zen',
  'Iwa',
  'Oto',
  'Akari',
  'Kagami',
  'Hoshi',
  'Kura',
];

const KINDS: ChatKind[] = ['相談', '指示', '雑談', '報告'];

const KIND_BADGE_COLOR: Record<ChatKind, string> = {
  相談: 'bg-sky-900/60 text-sky-300 border-sky-700/50',
  指示: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
  雑談: 'bg-zinc-800 text-zinc-400 border-zinc-700/50',
  報告: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
};

const SENSITIVE_WARNING =
  'カード番号・電話番号・API key・token・password は入力しないでください。';

// ---- Toast ----

type ToastState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

function Toast({ state, onDismiss }: { state: ToastState; onDismiss: () => void }) {
  if (!state) return null;
  const isSuccess = state.type === 'success';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm transition-all ${
        isSuccess
          ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
          : 'bg-red-950 border-red-700 text-red-300'
      }`}
    >
      <span className="flex-1">{state.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="閉じる"
      >
        ✕
      </button>
    </div>
  );
}

// ---- HaltWarning ----

function HaltWarning() {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-300"
    >
      <span className="shrink-0 font-bold">⚠</span>
      <span>
        <strong>owner_halt.flag</strong> が存在しています。Zen / Kai は一時停止中の可能性があります。
        送信は可能ですが、処理が遅れる場合があります。
      </span>
    </div>
  );
}

// ---- SentMessageRow ----

interface SentMessageEntry {
  filename: string;
  date: string;
  to: string;
  requestedAgent: string | null;
  kind: string;
  subject: string;
  isReply: boolean;
  fromOwner: boolean;
}

function SentMessageRow({ msg }: { msg: SentMessageEntry }) {
  const directionLabel = msg.isReply && !msg.fromOwner
    ? 'reply'
    : msg.requestedAgent
      ? `→ zen (req: ${msg.requestedAgent})`
      : `→ ${msg.to}`;

  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-zinc-200 truncate">
          {msg.subject || '(件名なし)'}
        </p>
        <p className="text-xs text-zinc-500">
          {directionLabel}
          {msg.kind && (
            <span className="ml-2 text-zinc-600">[{msg.kind}]</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {msg.isReply && !msg.fromOwner && (
          <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-800">
            返信
          </Badge>
        )}
        <span className="text-xs text-zinc-600 tabular-nums">{msg.date}</span>
      </div>
    </div>
  );
}

// ---- SendForm ----

interface SendFormProps {
  haltActive: boolean;
  onSendSuccess: (filename: string) => void;
  onSendError: (message: string) => void;
}

function SendForm({ haltActive, onSendSuccess, onSendError }: SendFormProps) {
  const [to, setTo] = useState<ChatRecipient>('Zen');
  const [kind, setKind] = useState<ChatKind>('相談');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const isValid = subject.trim().length > 0 && body.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, kind, subject: subject.trim(), body: body.trim() }),
        });
        const data: ChatSendResponse | ChatSendErrorResponse = await res.json();

        if (data.ok) {
          onSendSuccess(data.filename);
          setSubject('');
          setBody('');
        } else {
          onSendError(data.error);
        }
      } catch {
        onSendError('送信中にエラーが発生しました。しばらくしてから再試行してください。');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 宛先 + 種別 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="chat-to"
            className="block text-xs font-medium text-zinc-400 uppercase tracking-wider"
          >
            宛先
          </label>
          <select
            id="chat-to"
            value={to}
            onChange={(e) => setTo(e.target.value as ChatRecipient)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
          >
            {RECIPIENTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="chat-kind"
            className="block text-xs font-medium text-zinc-400 uppercase tracking-wider"
          >
            種別
          </label>
          <select
            id="chat-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ChatKind)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 件名 */}
      <div className="space-y-1.5">
        <label
          htmlFor="chat-subject"
          className="block text-xs font-medium text-zinc-400 uppercase tracking-wider"
        >
          件名
        </label>
        <input
          id="chat-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={100}
          placeholder="例: api-proxy テンプレートの方向性を相談したい"
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
        />
        <p className="text-right text-xs text-zinc-600">{subject.length}/100</p>
      </div>

      {/* 本文 */}
      <div className="space-y-1.5">
        <label
          htmlFor="chat-body"
          className="block text-xs font-medium text-zinc-400 uppercase tracking-wider"
        >
          本文
        </label>
        <textarea
          id="chat-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="本文を入力してください..."
          className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
        />
        <p className="text-right text-xs text-zinc-600">{body.length}/2000</p>
      </div>

      {/* 機微情報注意 */}
      <div className="flex items-start gap-2 rounded-md border border-zinc-700/50 bg-zinc-800/40 px-3 py-2.5 text-xs text-zinc-500">
        <span className="shrink-0">ℹ</span>
        <span>{SENSITIVE_WARNING}</span>
      </div>

      {/* halt 警告 */}
      {haltActive && <HaltWarning />}

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!isValid || isPending}
          size="lg"
          className="min-w-24"
        >
          {isPending ? '送信中...' : 'Send'}
        </Button>
      </div>
    </form>
  );
}

// ---- ChatPageClient ----

interface ChatPageClientProps {
  haltActive: boolean;
  initialMessages: SentMessageEntry[];
}

export function ChatPageClient({ haltActive, initialMessages }: ChatPageClientProps) {
  const [toast, setToast] = useState<ToastState>(null);
  const [messages, setMessages] = useState<SentMessageEntry[]>(initialMessages);

  function handleSuccess(filename: string) {
    // 送信成功時は楽観的に先頭にメッセージを追加
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);

    // filename から to / requestedAgent / kind / subject を推定
    const parts = filename.replace(/\.md$/, '').split('_');
    const toVal = parts[2] ?? '';
    const isRequestTo = filename.includes('_request_to_');
    const requestedAgent = isRequestTo
      ? (filename.match(/_request_to_(\w+)_/)?.[1] ?? null)
      : null;

    // subject はファイル名末尾から推定（あくまで補完）
    const subjectGuess = parts.slice(isRequestTo ? 6 : 3).join(' ');

    const newMsg: SentMessageEntry = {
      filename,
      date,
      to: toVal,
      requestedAgent,
      kind: '',
      subject: subjectGuess,
      isReply: false,
      fromOwner: true,
    };

    setMessages((prev) => [newMsg, ...prev]);
    setToast({ type: 'success', message: `送信しました: ${filename}` });
  }

  function handleError(message: string) {
    setToast({ type: 'error', message });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Chat
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Kai / Zen / チームメンバーに短いメッセージを送る
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* 送信フォーム (3/5) */}
        <div className="lg:col-span-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">新規メッセージ</CardTitle>
              <CardDescription className="text-zinc-500">
                board に Markdown として保存されます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendForm
                haltActive={haltActive}
                onSendSuccess={handleSuccess}
                onSendError={handleError}
              />
            </CardContent>
          </Card>
        </div>

        {/* 最近のメッセージ (2/5) */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-100">最近の送信 / 返信</CardTitle>
              <CardDescription className="text-zinc-500">
                board ファイルから読み取り (v0)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  まだメッセージがありません
                </p>
              ) : (
                <div className="space-y-0">
                  {messages.slice(0, 10).map((msg, i) => (
                    <div key={msg.filename}>
                      {i > 0 && <Separator className="my-1 bg-zinc-800" />}
                      <SentMessageRow msg={msg} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kind 凡例 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <span
                key={k}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${KIND_BADGE_COLOR[k]}`}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Toast state={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
