import type { NorthStarProgress as NorthStarProgressData } from '@/lib/data/north-star';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

interface NorthStarProgressProps {
  progress: NorthStarProgressData;
}

/* nokaze-design system axis 11: skill colors_and_type.css 由来の olive-soft 採用、 旧 hard-code #8b9a78 は drift */
const YUINO_OLIVE = 'var(--nokaze-olive-soft)';

export function NorthStarProgress({ progress }: NorthStarProgressProps) {
  const {
    junInterventionFrequencyWeekly,
    revenueCoverageRatio,
    distanceScore,
    fiveStepChecklist,
    aiBudgetMonthlyConsumption,
  } = progress;

  const distancePct = Math.max(0, Math.min(100, distanceScore));
  const revenuePct = Math.round(
    Math.max(0, Math.min(1, revenueCoverageRatio)) * 100,
  );
  const budgetPct = Math.round(
    Math.max(0, Math.min(1, aiBudgetMonthlyConsumption)) * 100,
  );

  return (
    <Card className="bg-foreground border-border">
      <CardHeader>
        <CardTitle className="text-muted-foreground">北極星 (Phase 1.5/2 完成条件)</CardTitle>
        <CardDescription className="text-muted-foreground">
          ジュン介入 週 1-2 回 + 売上が固定費超え安定 を同時達成
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">距離スコア</span>
              <span className="tabular-nums" style={{ color: YUINO_OLIVE }}>
                {distanceScore} / 100
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-foreground">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${distancePct}%`,
                  backgroundColor: YUINO_OLIVE,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">ジュン介入 (直近 7 day)</span>:
              {' '}
              <span className="tabular-nums text-muted-foreground">
                {junInterventionFrequencyWeekly} 件
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">売上カバー率</span>:
              {' '}
              <span className="tabular-nums text-muted-foreground">{revenuePct}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">AI 裁量予算消費</span>:
              {' '}
              <span className="tabular-nums text-muted-foreground">{budgetPct}%</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">5 step 実務</p>
            <ul className="space-y-1">
              {fiveStepChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span
                    className={
                      item.done
                        ? 'inline-block h-3 w-3 flex-shrink-0 rounded-full bg-emerald-500'
                        : 'inline-block h-3 w-3 flex-shrink-0 rounded-full border border-border bg-foreground'
                    }
                    aria-label={item.done ? '完了' : '未完'}
                  />
                  <span className="flex-1">
                    <span className="text-muted-foreground">{item.step}</span>
                    {' '}
                    <span className="text-muted-foreground">— {item.evidence}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
