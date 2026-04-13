import type { UnifiedKnot } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const hardnessColors: Record<string, string> = {
  L0: 'bg-zinc-600 text-zinc-200',
  L1: 'bg-blue-600 text-blue-100',
  L2: 'bg-yellow-600 text-yellow-100',
  L3: 'bg-orange-600 text-orange-100',
  LC: 'bg-red-600 text-red-100',
};

const agentColors: Record<string, string> = {
  zen: 'bg-purple-600 text-purple-100',
  kai: 'bg-green-600 text-green-100',
};

function formatValue(value: Record<string, unknown> | null): string {
  if (!value) return '-';
  if ('raw' in value && typeof value.raw === 'string') return value.raw;
  const keys = Object.keys(value);
  if (keys.length === 0) return '-';
  return JSON.stringify(value, null, 2);
}

interface KnotCardProps {
  knot: UnifiedKnot;
}

export function KnotCard({ knot }: KnotCardProps) {
  const triggerText = formatValue(knot.trigger);
  const effectText = formatValue(knot.effect);
  const compensationText = formatValue(knot.compensation);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-zinc-100 font-mono text-sm">
            {knot.id}
          </CardTitle>
          <Badge
            className={`${hardnessColors[knot.hardness] ?? hardnessColors.L0} border-0 text-xs`}
          >
            {knot.hardness}
          </Badge>
          <Badge
            className={`${agentColors[knot.agent] ?? ''} border-0 text-xs`}
          >
            {knot.agent}
          </Badge>
        </div>
        <CardDescription className="text-zinc-400 mt-1">
          {knot.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <details className="group">
          <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300 transition-colors select-none">
            Details
          </summary>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <span className="text-zinc-500 font-medium">Trigger</span>
              <pre className="mt-1 text-zinc-300 bg-zinc-800 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                {triggerText}
              </pre>
            </div>
            <div>
              <span className="text-zinc-500 font-medium">Effect</span>
              <pre className="mt-1 text-zinc-300 bg-zinc-800 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                {effectText}
              </pre>
            </div>
            <div>
              <span className="text-zinc-500 font-medium">Compensation</span>
              <pre className="mt-1 text-zinc-300 bg-zinc-800 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words text-xs">
                {compensationText}
              </pre>
            </div>
          </div>
        </details>
      </CardContent>

      <CardFooter className="text-xs text-zinc-500 gap-4">
        <span>Observed: {knot.observedCount}x</span>
        <span>Last: {knot.lastObserved ?? 'N/A'}</span>
      </CardFooter>
    </Card>
  );
}
