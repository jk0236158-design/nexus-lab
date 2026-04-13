import type { PipelineLead } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface LeadCardProps {
  lead: PipelineLead;
}

function scoreVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 80) return 'destructive';
  if (score >= 50) return 'default';
  return 'secondary';
}

function whyNowColor(score: number): string {
  if (score >= 80) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (score >= 50) return 'bg-sky-500/15 text-sky-400 border-sky-500/25';
  return 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40';
}

export function LeadCard({ lead }: LeadCardProps) {
  const isHighScore = lead.score >= 80;

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isHighScore
          ? 'border-amber-500/30 bg-zinc-900/80 ring-1 ring-amber-500/20'
          : 'border-zinc-700/50 bg-zinc-900'
      }`}
    >
      <div className="mb-1.5 font-semibold text-sm text-zinc-100 leading-tight">
        {lead.company}
      </div>

      <div className="mb-2 text-xs text-zinc-500">{lead.sector}</div>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={scoreVariant(lead.score)} className="text-[10px] h-4 px-1.5">
          Score {lead.score}
        </Badge>
        <span
          className={`inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] font-medium ${whyNowColor(lead.whyNowScore)}`}
        >
          Why Now {lead.whyNowScore}
        </span>
      </div>

      {lead.pain && (
        <p className="text-xs text-zinc-400 leading-snug line-clamp-1">
          {lead.pain}
        </p>
      )}
    </div>
  );
}
