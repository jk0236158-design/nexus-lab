import { getAgentStatuses, getBoardMessages, getOwnerDecisions } from '@/lib/data/shared-ops';
import { getSessionMetrics } from '@/lib/data/zen-reader';
import { AgentStatusCard } from '@/components/dashboard/agent-status-card';
import { BoardMessages } from '@/components/dashboard/board-messages';
import { OwnerDecisions } from '@/components/dashboard/owner-decisions';
import { SessionQuality } from '@/components/dashboard/session-quality';

export default async function HomePage() {
  const agentStatuses = getAgentStatuses();
  const boardMessages = getBoardMessages();
  const ownerDecisions = getOwnerDecisions();
  const sessionMetrics = getSessionMetrics();

  const zenStatus = agentStatuses.find((s) => s.agent === 'zen');
  const kaiStatus = agentStatuses.find((s) => s.agent === 'kai');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Nexus Lab Ops Console
        </p>
      </div>

      {/* Agent Status - 2 columns */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
      </section>

      {/* Messages & Decisions - 2 columns */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BoardMessages messages={boardMessages} />
        <OwnerDecisions decisions={ownerDecisions} />
      </section>

      {/* Session Quality */}
      <section>
        <SessionQuality metrics={sessionMetrics} />
      </section>
    </div>
  );
}
