import type { AgentStatus } from '@/lib/types';
import { AgentStatusCard } from './agent-status-card';
import { AiraStatusCard } from './aira-status-card';
import { YuinoStatusCard } from './yuino-status-card';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

interface NokazeEcosystemViewProps {
  agentStatuses: AgentStatus[];
}

export const NARRATIVE_TOOLTIP =
  'Aira (内部実装) と Yuino (公開商品) は同じ実体の 2 つの語り。 ' +
  '内部で動かす時 = Aira、 外に売る時 = Yuino。 別 entity ではない。';

export function NokazeEcosystemView({
  agentStatuses,
}: NokazeEcosystemViewProps) {
  const zenStatus = agentStatuses.find((s) => s.agent === 'zen');
  const kaiStatus = agentStatuses.find((s) => s.agent === 'kai');
  const airaStatus = agentStatuses.find((s) => s.agent === 'aira');
  const yuinoStatus = agentStatuses.find((s) => s.agent === 'yuino');

  return (
    <Card className="bg-foreground border-border">
      <CardHeader>
        <CardTitle className="text-muted-foreground">nokaze ecosystem</CardTitle>
        <CardDescription className="text-muted-foreground">
          <span
            className="cursor-help underline decoration-dotted decoration-muted-foreground underline-offset-4"
            title={NARRATIVE_TOOLTIP}
            aria-label={NARRATIVE_TOOLTIP}
            data-testid="nokaze-narrative-tooltip"
          >
            1 実体 2 語り (Aira = Yuino)
          </span>
          {' '}・ AI 運営者 (Zen + Kai) と 商品 surface (Aira / Yuino)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AgentStatusCard
            status={zenStatus}
            agentName="zen"
            label="Zen (CTO)"
          />
          <AgentStatusCard
            status={kaiStatus}
            agentName="kai"
            label="Kai (BizDev)"
          />
          <AiraStatusCard status={airaStatus} />
          <YuinoStatusCard status={yuinoStatus} />
        </div>
      </CardContent>
    </Card>
  );
}
