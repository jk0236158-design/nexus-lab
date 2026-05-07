import { getAgentStatuses, getBoardMessages, getOwnerDecisions } from '@/lib/data/shared-ops';
import { getSessionMetrics } from '@/lib/data/zen-reader';
import { getNorthStarProgress } from '@/lib/data/north-star';
import { getWatcherStatus } from '@/lib/data/watcher';
import { NokazeEcosystemView } from '@/components/dashboard/nokaze-ecosystem-view';
import { BoardMessages } from '@/components/dashboard/board-messages';
import { OwnerDecisions } from '@/components/dashboard/owner-decisions';
import { SessionQuality } from '@/components/dashboard/session-quality';
import { WatcherStatusCard } from '@/components/dashboard/watcher-status-card';
import { NorthStarProgress } from '@/components/header/north-star-progress';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const agentStatuses = getAgentStatuses();
  const boardMessages = getBoardMessages();
  const ownerDecisions = getOwnerDecisions();
  const sessionMetrics = getSessionMetrics();
  const northStar = getNorthStarProgress();
  const watcherStatus = getWatcherStatus();

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

      {/* 北極星 Progress (Phase 1.5/2 完成条件) */}
      <NorthStarProgress progress={northStar} />

      {/* nokaze ecosystem 4 axis (Zen / Kai / Aira / Yuino) */}
      <NokazeEcosystemView agentStatuses={agentStatuses} />

      {/* Watcher status (Pattern C step 1 reform 連動) */}
      <WatcherStatusCard status={watcherStatus} />

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
