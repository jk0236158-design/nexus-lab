import type { AgentStatus } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentStatusCardProps {
  status: AgentStatus | undefined;
  agentName: string;
  label: string;
}

export function AgentStatusCard({
  status,
  agentName,
  label,
}: AgentStatusCardProps) {
  if (!status) {
    return (
      <Card className="bg-foreground border-border">
        <CardHeader>
          <CardTitle className="text-muted-foreground">{label}</CardTitle>
          <CardDescription className="text-muted-foreground">
            ステータス情報なし
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
    <Card className="bg-foreground border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-muted-foreground">{label}</CardTitle>
          <Badge variant={status.isOnline ? 'default' : 'secondary'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          最終セッション: {status.lastSession || '不明'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {summaryLines.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
