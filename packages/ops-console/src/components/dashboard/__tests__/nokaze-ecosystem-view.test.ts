import { describe, it, expect } from 'vitest';
import type { AgentStatus } from '@/lib/types';
import {
  NokazeEcosystemView,
  NARRATIVE_TOOLTIP,
} from '../nokaze-ecosystem-view';

describe('NokazeEcosystemView', () => {
  it('React component として export されている', () => {
    expect(typeof NokazeEcosystemView).toBe('function');
    expect(NokazeEcosystemView.name).toBe('NokazeEcosystemView');
  });

  it('NARRATIVE_TOOLTIP に 1 entity 2 narrative 概念が含まれる', () => {
    expect(NARRATIVE_TOOLTIP).toContain('Aira');
    expect(NARRATIVE_TOOLTIP).toContain('Yuino');
    expect(NARRATIVE_TOOLTIP).toContain('同じ実体');
  });

  it('4 axis status 配列を受理しても throw しない', () => {
    const agentStatuses: AgentStatus[] = [
      { agent: 'zen', lastSession: '2026-05-07', summary: 'CTO summary', isOnline: false },
      { agent: 'kai', lastSession: '2026-05-07', summary: 'BizDev summary', isOnline: false },
      { agent: 'aira', lastSession: '2026-05-07', summary: 'closed loop', isOnline: false },
      { agent: 'yuino', lastSession: '2026-05-07', summary: 'digest', isOnline: false },
    ];
    expect(() => NokazeEcosystemView({ agentStatuses })).not.toThrow();
  });

  it('空配列でも throw しない (placeholder)', () => {
    expect(() => NokazeEcosystemView({ agentStatuses: [] })).not.toThrow();
  });
});
