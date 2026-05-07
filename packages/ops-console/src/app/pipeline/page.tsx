import { getKaiLeads } from '@/lib/data/kai-reader';
import { KanbanBoard } from '@/components/pipeline/kanban-board';

export const dynamic = 'force-dynamic';

export default function PipelinePage() {
  const leads = getKaiLeads();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-muted-foreground">
        Pipeline
      </h1>
      <p className="mt-2 text-muted-foreground">
        Kaiの営業パイプライン — リードのステータス管理
      </p>

      <div className="mt-6">
        <KanbanBoard leads={leads} />
      </div>
    </div>
  );
}
