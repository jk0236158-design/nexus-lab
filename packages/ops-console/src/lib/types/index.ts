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
  sendPacketStatus?: string;
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

// Chat 宛先
export type ChatRecipient =
  | 'Kai'
  | 'Zen'
  | 'Iwa'
  | 'Oto'
  | 'Akari'
  | 'Kagami'
  | 'Hoshi'
  | 'Kura';

// Chat 種別
export type ChatKind = '相談' | '指示' | '雑談' | '報告';

// Chat 送信リクエスト
export interface ChatSendRequest {
  to: ChatRecipient;
  kind: ChatKind;
  subject: string;
  body: string;
}

// Chat 送信レスポンス (success)
export interface ChatSendResponse {
  ok: true;
  filename: string;
}

// Chat 送信レスポンス (error)
export interface ChatSendErrorResponse {
  ok: false;
  error: string;
}

// Chat 送信済みメッセージ (UI 表示用)
export interface ChatSentMessage {
  filename: string;
  date: string;
  to: string;
  requestedAgent: string | null;
  kind: string;
  subject: string;
  isReply: boolean;
  fromOwner: boolean;
}

// オーナー判断
export interface OwnerDecision {
  filename: string;
  date: string;
  title: string;
  content: string;
}
