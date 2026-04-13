import { getKaiLeads } from '@/lib/data/kai-reader';
import { KanbanBoard } from '@/components/pipeline/kanban-board';

export const dynamic = 'force-dynamic';

export default function PipelinePage() {
  const leads = getKaiLeads();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        Pipeline
      </h1>
      <p className="mt-2 text-zinc-400">
        Kaiの営業パイプライン — リードのステータス管理
      </p>

      <div className="mt-6">
        <KanbanBoard leads={leads} />
      </div>
    </div>
  );
}
