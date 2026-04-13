import { getAgentStatuses } from '@/lib/data/shared-ops';
import { getSessionMetrics } from '@/lib/data/zen-reader';
import type { AgentStatus, SessionMetrics } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function AgentOverviewCard({
  status,
  label,
  role,
}: {
  status: AgentStatus | undefined;
  label: string;
  role: string;
}) {
  if (!status) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100">{label}</CardTitle>
          <CardDescription className="text-zinc-500">
            ステータス情報なし
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summaryLines = status.summary
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 5);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle className="text-zinc-100">{label}</CardTitle>
          <Badge variant={status.isOnline ? 'default' : 'secondary'}>
            {status.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <CardDescription className="text-zinc-400">
          {role}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            最終セッション: {status.lastSession || '不明'}
          </p>
          <div className="space-y-1">
            {summaryLines.map((line, i) => (
              <p key={i} className="text-sm text-zinc-400 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionHistoryTable({ metrics }: { metrics: SessionMetrics[] }) {
  if (metrics.length === 0) {
    return (
      <p className="text-sm text-zinc-500">セッションデータがありません</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-xs text-zinc-500 uppercase tracking-wider">
            <th className="py-3 pr-4 font-medium">日付</th>
            <th className="py-3 pr-4 font-medium text-right">成果物数</th>
            <th className="py-3 pr-4 font-medium text-right">エラー数</th>
            <th className="py-3 pr-4 font-medium text-right">品質</th>
            <th className="py-3 pr-4 font-medium text-right">委任率</th>
            <th className="py-3 font-medium">Knot活性化</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, i) => (
            <tr
              key={m.sessionDate}
              className={
                i % 2 === 1 ? 'bg-zinc-800/40' : ''
              }
            >
              <td className="py-2.5 pr-4 text-zinc-300 whitespace-nowrap">
                {m.sessionDate}
              </td>
              <td className="py-2.5 pr-4 text-right text-zinc-300">
                {m.outputCount}
              </td>
              <td className="py-2.5 pr-4 text-right">
                <span className={m.errorCount > 0 ? 'text-red-400' : 'text-zinc-400'}>
                  {m.errorCount}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-right">
                <span
                  className={
                    m.qualityScore >= 0.8
                      ? 'text-emerald-400'
                      : m.qualityScore >= 0.5
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }
                >
                  {Math.round(m.qualityScore * 100)}%
                </span>
              </td>
              <td className="py-2.5 pr-4 text-right text-zinc-300">
                {Math.round(m.delegationRatio * 100)}%
              </td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-1">
                  {m.knotActivations.length > 0 ? (
                    m.knotActivations.map((knot) => (
                      <Badge key={knot} variant="outline" className="text-xs">
                        {knot}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-zinc-600">-</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AgentsPage() {
  const agentStatuses = getAgentStatuses();
  const sessionMetrics = getSessionMetrics();

  const zenStatus = agentStatuses.find((s) => s.agent === 'zen');
  const kaiStatus = agentStatuses.find((s) => s.agent === 'kai');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Agents
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          エージェントの状態と活動履歴
        </p>
      </div>

      {/* Agent Overview - 2 columns */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AgentOverviewCard
          status={zenStatus}
          label="Zen"
          role="CTO / Project Lead — 統括・設計・意思決定"
        />
        <AgentOverviewCard
          status={kaiStatus}
          label="Kai"
          role="BizDev — 営業・市場開拓"
        />
      </section>

      {/* Session History Table */}
      <section>
        <h2 className="text-lg font-medium text-zinc-200 mb-4">
          セッション履歴（Zen）
        </h2>
        <SessionHistoryTable metrics={sessionMetrics} />
      </section>

      {/* Coming Soon */}
      <section>
        <Card className="bg-zinc-800 border-zinc-700/50">
          <CardContent className="py-2">
            <p className="text-sm text-zinc-500 text-center">
              タスク投入・リアルタイム実行機能は今後のアップデートで追加予定です
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
