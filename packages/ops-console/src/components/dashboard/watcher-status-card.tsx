import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WatcherStatus } from '@/lib/data/watcher';

interface WatcherStatusCardProps {
  status: WatcherStatus;
}

const STATE_BADGE_VARIANT: Record<
  WatcherStatus['state'],
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  running: 'default',
  stale: 'secondary',
  down: 'destructive',
};

const STATE_LABEL: Record<WatcherStatus['state'], string> = {
  running: '稼働中',
  stale: '更新が古い',
  down: '停止中',
};

export function WatcherStatusCard({ status }: WatcherStatusCardProps) {
  const recentTail = status.recentLogLines.slice(-5);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-muted-foreground">SharedOpsWatcher</CardTitle>
            <CardDescription className="text-muted-foreground">
              pid: {status.pid ?? '-'} / last log:{' '}
              {status.lastLogModifiedAt ?? '-'}
            </CardDescription>
          </div>
          <Badge variant={STATE_BADGE_VARIANT[status.state]}>
            {STATE_LABEL[status.state]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">本日 suppressed</p>
            <p className="text-2xl font-semibold text-muted-foreground">
              {status.suppressedCountToday}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">累計 suppressed</p>
            <p className="text-2xl font-semibold text-muted-foreground">
              {status.suppressedCountTotal}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">false_positive (placeholder)</p>
            <p className="text-sm text-muted-foreground">0</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">false_negative (placeholder)</p>
            <p className="text-sm text-muted-foreground">0</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-1">直近 log (最新 5 件)</p>
        {recentTail.length === 0 ? (
          <p className="text-xs text-muted-foreground">log 未記録</p>
        ) : (
          <pre className="overflow-auto rounded-md border border-border bg-card p-2 text-[10px] text-muted-foreground leading-snug whitespace-pre-wrap">
            {recentTail.join('\n')}
          </pre>
        )}

        <p className="mt-2 text-[10px] text-muted-foreground">
          last suppressed: {status.lastSuppressedAt ?? '-'} / source:{' '}
          {status.sources.logPath}
        </p>
      </CardContent>
    </Card>
  );
}
