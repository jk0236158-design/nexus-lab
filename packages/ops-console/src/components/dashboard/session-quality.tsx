import type { SessionMetrics } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface SessionQualityProps {
  metrics: SessionMetrics[];
}

export function SessionQuality({ metrics }: SessionQualityProps) {
  const recent = metrics.slice(0, 5);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">セッション品質</CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500">メトリクスデータなし</p>
        ) : (
          <div className="space-y-3">
            {recent.map((m) => {
              const pct = Math.min(Math.max(m.qualityScore * 20, 0), 100);
              const color =
                m.qualityScore >= 4
                  ? 'bg-emerald-500'
                  : m.qualityScore >= 3
                    ? 'bg-amber-500'
                    : 'bg-red-500';

              return (
                <div key={m.sessionDate} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 tabular-nums">
                      {m.sessionDate}
                    </span>
                    <span className="text-zinc-500">
                      {m.qualityScore}/5
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-2 rounded-full ${color} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
