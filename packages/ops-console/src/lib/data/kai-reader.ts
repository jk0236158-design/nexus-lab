import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { PipelineLead, UnifiedKnot } from '../types';

const CODEX_STATE_PATH =
  process.env.CODEX_STATE_PATH || 'C:\\Users\\jk023\\Desktop\\Weekly Signal Desk\\state';

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

    const packetStatuses = getSendPacketStatuses();

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
      sendPacketStatus: packetStatuses.get(item.id),
    }));
  } catch {
    return [];
  }
}

function getSendPacketStatuses(): Map<string, string> {
  const filePath = join(CODEX_STATE_PATH, 'send_packets.json');
  if (!existsSync(filePath)) return new Map();

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const packets = JSON.parse(raw) as Array<{ lead_id: string; status: string }>;
    if (!Array.isArray(packets)) return new Map();

    const map = new Map<string, string>();
    for (const p of packets) {
      map.set(p.lead_id, p.status);
    }
    return map;
  } catch {
    return new Map();
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

    const eventCounts = getKnotEventCounts();

    return data.map((item) => ({
      id: item.id,
      agent: 'kai' as const,
      type: 'knot',
      description: item.name ?? item.id,
      trigger: { raw: item.trigger ?? '' },
      effect: { raw: item.effect ?? '' },
      compensation: item.compensation ? { raw: item.compensation } : null,
      hardness: normalizeHardness(item.hardness),
      observedCount: eventCounts.get(item.id) ?? 0,
      firstObserved: item.created_at ?? null,
      lastObserved: item.updated_at ?? null,
    }));
  } catch {
    return [];
  }
}

function getKnotEventCounts(): Map<string, number> {
  const filePath = join(CODEX_STATE_PATH, 'knot_events.json');
  if (!existsSync(filePath)) return new Map();

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const events = JSON.parse(raw) as Array<{ knot_id: string }>;
    if (!Array.isArray(events)) return new Map();

    const counts = new Map<string, number>();
    for (const event of events) {
      counts.set(event.knot_id, (counts.get(event.knot_id) ?? 0) + 1);
    }
    return counts;
  } catch {
    return new Map();
  }
}

function normalizeHardness(
  h: string,
): 'L0' | 'L1' | 'L2' | 'L3' | 'LC' {
  const valid = ['L0', 'L1', 'L2', 'L3', 'LC'];
  return valid.includes(h) ? (h as 'L0' | 'L1' | 'L2' | 'L3' | 'LC') : 'L0';
}

