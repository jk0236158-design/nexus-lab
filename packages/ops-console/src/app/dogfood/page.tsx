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
          <h1 className="text-2xl font-semibold tracking-tight text-muted-foreground">
            Dogfood
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Yuino dogfood closed loop (観察 → 判断 → 実行 → 検証 → 復旧 → 実行) の観察 view (read-only) — 内部実装 = Aira (Kai 主導)
          </p>
        </div>
        <p className="text-xs text-muted-foreground self-end">
          last run: {status.lastRunAt ?? '不明'}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          6 step status
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          現状 Aira dispatch log には 6 step 形式の event がまだ記録されていない (`zen_board_review_request` 等の action_type のみ)。
          {' '}6 step 形式の closed-loop log は Phase B (5/13-5/22) で Kai-side が拡張予定、 現在は placeholder 表示。
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CLOSED_LOOP_STEPS.map((step) => {
            const info = stepMap[step];
            return (
              <Card key={step} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-muted-foreground text-base">
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
                  <p className="text-xs text-muted-foreground">
                    {info?.lastTimestamp ?? '-'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              false positive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-muted-foreground">
              {status.falsePositiveCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              axis 12 v0 connect 後に更新
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              false negative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-muted-foreground">
              {status.falseNegativeCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              axis 12 v0 connect 後に更新
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">last reset</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {status.lastResetAt ?? '-'}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-muted-foreground">直近 events</CardTitle>
          <CardDescription className="text-muted-foreground">
            {status.recentEvents.length} 件 (新しい順)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status.recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              event 未記録 ({status.sources.logPath} 不在)
            </p>
          ) : (
            <div className="space-y-1">
              {status.recentEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-xs text-muted-foreground py-1 border-b border-border last:border-b-0"
                >
                  <span className="shrink-0 text-muted-foreground w-44 truncate">
                    {ev.timestamp || '-'}
                  </span>
                  <span className="shrink-0 text-muted-foreground w-56 truncate">
                    {ev.step}
                  </span>
                  <span className="shrink-0 text-muted-foreground w-20 truncate">
                    {ev.status}
                  </span>
                  <span className="flex-1 text-muted-foreground truncate">
                    {ev.evidence ?? ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        sources: {status.sources.statusPath} / {status.sources.logPath}
      </p>
    </div>
  );
}
