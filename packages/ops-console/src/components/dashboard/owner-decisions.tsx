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
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">オーナー判断</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500">判断記録なし</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((d) => (
              <li
                key={d.filename}
                className="flex items-center gap-3 text-sm"
              >
                <span className="shrink-0 text-xs text-zinc-600 tabular-nums">
                  {d.date}
                </span>
                <span className="text-zinc-300">{d.title}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
