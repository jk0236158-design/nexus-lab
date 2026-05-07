import type { OwnerDecision } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface OwnerDecisionsProps {
  decisions: OwnerDecision[];
}

export function OwnerDecisions({ decisions }: OwnerDecisionsProps) {
  const sorted = [...decisions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-muted-foreground">オーナー判断</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">判断記録なし</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((d) => (
              <li
                key={d.filename}
                className="flex items-center gap-3 text-sm"
              >
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {d.date}
                </span>
                <span className="text-muted-foreground">{d.title}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
