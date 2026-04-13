import type { PipelineLead } from '@/lib/types';
import { LeadCard } from './lead-card';

interface Column {
  key: string;
  label: string;
  statuses: string[];
  accent?: string;
}

const COLUMNS: Column[] = [
  { key: 'new', label: 'New', statuses: ['new'] },
  { key: 'signal', label: 'Signal', statuses: ['signal_detected'] },
  { key: 'draft', label: 'Draft', statuses: ['ready_for_draft', 'draft_in_progress'] },
  { key: 'ready', label: 'Ready to Send', statuses: [] },
  { key: 'hold', label: 'Hold', statuses: ['hold'], accent: 'red' },
  { key: 'sent', label: 'Sent', statuses: ['sent'] },
  { key: 'reply', label: 'Reply', statuses: ['reply_received'] },
];

function groupLeads(leads: PipelineLead[]): Map<string, PipelineLead[]> {
  const map = new Map<string, PipelineLead[]>();
  for (const col of COLUMNS) {
    map.set(col.key, []);
  }
  for (const lead of leads) {
    // send_packets.jsonのステータスでオーバーライド
    if (lead.sendPacketStatus === 'ready_for_human_send') {
      map.get('ready')!.push(lead);
    } else if (lead.sendPacketStatus === 'sent') {
      map.get('sent')!.push(lead);
    } else {
      const col = COLUMNS.find((c) => c.statuses.includes(lead.status));
      const key = col ? col.key : 'new';
      map.get(key)!.push(lead);
    }
  }
  return map;
}

function columnHeaderClass(accent?: string): string {
  if (accent === 'red') {
    return 'bg-red-950/60 border-red-800/40';
  }
  return 'bg-zinc-800 border-zinc-700/50';
}

function columnBorderClass(accent?: string): string {
  if (accent === 'red') {
    return 'border-red-900/30';
  }
  return 'border-zinc-800';
}

interface KanbanBoardProps {
  leads: PipelineLead[];
}

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const grouped = groupLeads(leads);

  if (leads.length === 0) {
    return (
      <p className="mt-6 text-zinc-500 text-sm">
        リードデータがありません。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex gap-3 min-w-max">
        {COLUMNS.map((col) => {
          const colLeads = grouped.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              className={`flex min-w-[220px] max-w-[260px] flex-col rounded-lg border ${columnBorderClass(col.accent)}`}
            >
              {/* Column header */}
              <div
                className={`flex items-center justify-between rounded-t-lg border-b px-3 py-2 ${columnHeaderClass(col.accent)}`}
              >
                <span className="text-sm font-medium text-zinc-200">
                  {col.label}
                </span>
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-700/60 px-1.5 text-[11px] font-medium text-zinc-300">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2">
                {colLeads.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-600">--</p>
                ) : (
                  colLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
