import type { AgentStatus } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface YuinoStatusCardProps {
  status: AgentStatus | undefined;
}

/* nokaze-design system axis 11: skill colors_and_type.css 由来の olive-soft (dark variant accent) を採用、 旧 hard-code #8b9a78 は drift (skill 不採用 narrative) */
const YUINO_OLIVE = 'var(--nokaze-olive-soft)';

export function YuinoStatusCard({ status }: YuinoStatusCardProps) {
  if (!status) {
    return (
      <Card
        className="bg-foreground"
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: YUINO_OLIVE,
        }}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4"
              style={{ color: YUINO_OLIVE }}
              aria-hidden="true"
            />
            <CardTitle className="text-muted-foreground">Yuino</CardTitle>
            <Badge variant="outline">公開商品</Badge>
          </div>
          <CardDescription className="text-muted-foreground">
            公開商品 surface (Zen + Kai 共同) — 状態不明
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
    <Card
      className="bg-foreground"
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: YUINO_OLIVE,
      }}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-4 w-4"
            style={{ color: YUINO_OLIVE }}
            aria-hidden="true"
          />
          <CardTitle className="text-muted-foreground">Yuino</CardTitle>
          <Badge variant="outline">公開商品</Badge>
          <Badge variant={status.isOnline ? 'default' : 'secondary'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          公開商品 surface (Zen + Kai 共同) ・ 最終: {status.lastSession || '不明'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {summaryLines.length === 0 ? (
            <p className="text-sm text-muted-foreground">summary なし</p>
          ) : (
            summaryLines.map((line, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                {line}
              </p>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
