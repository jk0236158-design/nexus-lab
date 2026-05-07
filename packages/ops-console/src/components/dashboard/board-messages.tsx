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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-muted-foreground">最新メッセージ</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">メッセージなし</p>
        ) : (
          <div className="space-y-0">
            {sorted.map((msg, i) => (
              <div key={msg.filename}>
                {i > 0 && <Separator className="my-3 bg-card" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-muted-foreground">{msg.from}</span>
                      <span className="text-muted-foreground mx-1.5">&rarr;</span>
                      <span className="text-muted-foreground">{msg.to}</span>
                      <span className="text-muted-foreground mx-1.5">:</span>
                      <span className="font-medium">{msg.subject}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
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
