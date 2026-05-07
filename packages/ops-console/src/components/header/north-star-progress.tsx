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

const YUINO_OLIVE = '#8b9a78';

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
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-100">北極星 (Phase 1.5/2 完成条件)</CardTitle>
        <CardDescription className="text-zinc-500">
          ジュン介入 週 1-2 回 + 売上が固定費超え安定 を同時達成
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">距離スコア</span>
              <span className="tabular-nums" style={{ color: YUINO_OLIVE }}>
                {distanceScore} / 100
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-zinc-800">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${distancePct}%`,
                  backgroundColor: YUINO_OLIVE,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs text-zinc-400 md:grid-cols-3">
            <div>
              <span className="text-zinc-500">ジュン介入 (直近 7 day)</span>:
              {' '}
              <span className="tabular-nums text-zinc-200">
                {junInterventionFrequencyWeekly} 件
              </span>
            </div>
            <div>
              <span className="text-zinc-500">売上カバー率</span>:
              {' '}
              <span className="tabular-nums text-zinc-200">{revenuePct}%</span>
            </div>
            <div>
              <span className="text-zinc-500">AI 裁量予算消費</span>:
              {' '}
              <span className="tabular-nums text-zinc-200">{budgetPct}%</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-zinc-300">5 step 実務</p>
            <ul className="space-y-1">
              {fiveStepChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span
                    className={
                      item.done
                        ? 'inline-block h-3 w-3 flex-shrink-0 rounded-full bg-emerald-500'
                        : 'inline-block h-3 w-3 flex-shrink-0 rounded-full border border-zinc-600 bg-zinc-800'
                    }
                    aria-label={item.done ? '完了' : '未完'}
                  />
                  <span className="flex-1">
                    <span className="text-zinc-200">{item.step}</span>
                    {' '}
                    <span className="text-zinc-500">— {item.evidence}</span>
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
