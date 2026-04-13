'use client';

import type { BoardMessage } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BoardMessagesProps {
  messages: BoardMessage[];
}

export function BoardMessages({ messages }: BoardMessagesProps) {
  const sorted = [...messages]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">最新メッセージ</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500">メッセージなし</p>
        ) : (
          <div className="space-y-0">
            {sorted.map((msg, i) => (
              <div key={msg.filename}>
                {i > 0 && <Separator className="my-3 bg-zinc-800" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-100">
                      <span className="text-zinc-400">{msg.from}</span>
                      <span className="text-zinc-600 mx-1.5">&rarr;</span>
                      <span className="text-zinc-400">{msg.to}</span>
                      <span className="text-zinc-600 mx-1.5">:</span>
                      <span className="font-medium">{msg.subject}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-600">
                    {msg.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
