import {
  getAiraClosedLoopStatus,
  summarizeStepStatuses,
  CLOSED_LOOP_STEPS,
} from '@/lib/data/aira-closed-loop';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function DogfoodPage() {
  const status = getAiraClosedLoopStatus();
  const stepMap = summarizeStepStatuses(status.recentEvents);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Dogfood
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Aira closed loop (observe → decide → dispatch → verify → recover →
            execute) の観察 view (read-only)
          </p>
        </div>
        <p className="text-xs text-zinc-600 self-end">
          last run: {status.lastRunAt ?? '不明'}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">
          6 step status
        </h2>
        <p className="text-xs text-zinc-500 mb-3">
          現状 Aira dispatch log には 6 step 形式の event がまだ記録されていない (`zen_board_review_request` 等の action_type のみ)。
          {' '}6 step 形式の closed-loop log は Phase B (5/13-5/22) で Kai-side が拡張予定、 現在は placeholder 表示。
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CLOSED_LOOP_STEPS.map((step) => {
            const info = stepMap[step];
            return (
              <Card key={step} className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-zinc-100 text-base">
                      {step}
                    </CardTitle>
                    <Badge
                      variant={
                        info?.lastStatus === 'ok' ? 'default' : 'secondary'
                      }
                    >
                      {info?.lastStatus ?? '記録なし'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-500">
                    {info?.lastTimestamp ?? '-'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm">
              false positive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">
              {status.falsePositiveCount}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              axis 12 v0 connect 後に更新
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm">
              false negative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-zinc-100">
              {status.falseNegativeCount}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              axis 12 v0 connect 後に更新
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100 text-sm">last reset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-300">
              {status.lastResetAt ?? '-'}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">直近 events</CardTitle>
          <CardDescription className="text-zinc-500">
            {status.recentEvents.length} 件 (新しい順)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.recentEvents.length === 0 ? (
            <p className="text-sm text-zinc-500">
              event 未記録 ({status.sources.logPath} 不在)
            </p>
          ) : (
            <div className="space-y-1">
              {status.recentEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-xs text-zinc-400 py-1 border-b border-zinc-900 last:border-b-0"
                >
                  <span className="shrink-0 text-zinc-600 w-44">
                    {ev.timestamp || '-'}
                  </span>
                  <span className="shrink-0 text-zinc-300 w-20">{ev.step}</span>
                  <span className="shrink-0 text-zinc-500 w-16">
                    {ev.status}
                  </span>
                  <span className="text-zinc-500 truncate">
                    {ev.evidence ?? ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-zinc-600">
        sources: {status.sources.statusPath} / {status.sources.logPath}
      </p>
    </div>
  );
}
