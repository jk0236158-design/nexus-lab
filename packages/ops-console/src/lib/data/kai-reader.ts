import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { PipelineLead, UnifiedKnot } from '../types';

const CODEX_STATE_PATH =
  process.env.CODEX_STATE_PATH || 'C:\\Users\\jk023\\Desktop\\codex\\state';

export function getKaiLeads(): PipelineLead[] {
  const filePath = join(CODEX_STATE_PATH, 'leads.json');
  if (!existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Array<{
      id: string;
      company: string;
      domain: string;
      sector: string;
      status: string;
      pain: string;
      score: number;
      why_now_score: number;
      why_now_summary: string;
      created_at: string;
    }>;

    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      id: item.id,
      company: item.company ?? '',
      domain: item.domain ?? '',
      sector: item.sector ?? '',
      status: item.status ?? 'unknown',
      pain: item.pain ?? '',
      score: item.score ?? 0,
      whyNowScore: item.why_now_score ?? 0,
      whyNowSummary: item.why_now_summary ?? '',
      createdAt: item.created_at ?? '',
    }));
  } catch {
    return [];
  }
}

export function getKaiKnots(): UnifiedKnot[] {
  const filePath = join(CODEX_STATE_PATH, 'operational_knots.json');
  if (!existsSync(filePath)) return [];

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Array<{
      id: string;
      name: string;
      trigger: string;
      effect: string;
      compensation: string;
      hardness: string;
      activation: string;
      evidence: string;
      created_at: string;
      updated_at: string;
    }>;

    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      id: item.id,
      agent: 'kai' as const,
      type: 'knot',
      description: item.name ?? item.id,
      trigger: { raw: item.trigger ?? '' },
      effect: { raw: item.effect ?? '' },
      compensation: item.compensation ? { raw: item.compensation } : null,
      hardness: normalizeHardness(item.hardness),
      observedCount: activationToCount(item.activation),
      firstObserved: item.created_at ?? null,
      lastObserved: item.updated_at ?? null,
    }));
  } catch {
    return [];
  }
}

function normalizeHardness(
  h: string,
): 'L0' | 'L1' | 'L2' | 'L3' | 'LC' {
  const valid = ['L0', 'L1', 'L2', 'L3', 'LC'];
  return valid.includes(h) ? (h as 'L0' | 'L1' | 'L2' | 'L3' | 'LC') : 'L0';
}

function activationToCount(activation: string): number {
  switch (activation) {
    case 'high':
      return 10;
    case 'medium':
      return 5;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
