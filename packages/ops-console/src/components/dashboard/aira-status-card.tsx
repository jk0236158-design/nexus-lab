import type { AgentStatus } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cog } from 'lucide-react';

interface AiraStatusCardProps {
  status: AgentStatus | undefined;
}

export function AiraStatusCard({ status }: AiraStatusCardProps) {
  if (!status) {
    return (
      <Card className="bg-zinc-900 border border-zinc-700 font-mono">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <CardTitle className="text-zinc-300">Aira</CardTitle>
            <Badge variant="secondary">内部実装</Badge>
          </div>
          <CardDescription className="text-zinc-500">
            内部 supervisor (Kai 主導) — 状態不明
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summaryLines = status.summary
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 4);

  return (
    <Card className="bg-zinc-900 border border-zinc-700 font-mono">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Cog className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <CardTitle className="text-zinc-300">Aira</CardTitle>
          <Badge variant="secondary">内部実装</Badge>
          <Badge variant={status.isOnline ? 'default' : 'secondary'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription className="text-zinc-500">
          内部 supervisor (Kai 主導) ・ 最終: {status.lastSession || '不明'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {summaryLines.length === 0 ? (
            <p className="text-xs text-zinc-500">summary なし</p>
          ) : (
            summaryLines.map((line, i) => (
              <p key={i} className="text-xs text-zinc-400 leading-relaxed">
                {line}
              </p>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
