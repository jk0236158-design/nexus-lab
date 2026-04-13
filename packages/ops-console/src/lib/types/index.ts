// エージェントの状態
export interface AgentStatus {
  agent: 'zen' | 'kai';
  lastSession: string;
  summary: string;
  isOnline: boolean;
}

// 統合Knot表現
export interface UnifiedKnot {
  id: string;
  agent: 'zen' | 'kai';
  type: string;
  description: string;
  trigger: Record<string, unknown>;
  effect: Record<string, unknown>;
  compensation: Record<string, unknown> | null;
  hardness: 'L0' | 'L1' | 'L2' | 'L3' | 'LC';
  observedCount: number;
  firstObserved: string | null;
  lastObserved: string | null;
}

// 営業リード
export interface PipelineLead {
  id: string;
  company: string;
  domain: string;
  sector: string;
  status: string;
  pain: string;
  score: number;
  whyNowScore: number;
  whyNowSummary: string;
  createdAt: string;
}

// セッションメトリクス
export interface SessionMetrics {
  sessionDate: string;
  outputCount: number;
  errorCount: number;
  qualityScore: number;
  delegationRatio: number;
  knotActivations: string[];
  notes: string;
}

// board メッセージ
export interface BoardMessage {
  filename: string;
  date: string;
  from: string;
  to: string;
  subject: string;
  content: string;
}

// オーナー判断
export interface OwnerDecision {
  filename: string;
  date: string;
  title: string;
  content: string;
}
