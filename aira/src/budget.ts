/**
 * budget.ts — token budget logic
 *
 * Kura subscription plan v0.2 final §3:
 *   - Phase 0+1+2 combined: ¥586/月 mid (Green 帯維持)
 *   - Gemini 2.0 Flash 入力: $0.075/1M tokens = ~¥11/1M tokens (@¥150/USD)
 *   - Gemini 2.0 Flash 出力: $0.30/1M tokens = ~¥45/1M tokens (@¥150/USD)
 *   - daily digest: ~5,000 input + ~500 output tokens/day
 *   - 月 30 日: input 150k + output 15k tokens → ~¥2 + ~¥1 = ~¥3/月
 *   - scope creep self-detection +500 tokens/digest: ¥1-6/月
 *   - naming split audit 月次 15k tokens: ~¥0/月
 *   Total: ¥4-9/月 (v0.2 ¥586/月 mid 内で余裕)
 *
 * このモジュールは daily token budget の計測と超過判定を担う。
 */

export interface TokenBudget {
  /** Gemini 2.0 Flash 入力トークン上限 (daily) */
  dailyInputLimit: number;
  /** Gemini 2.0 Flash 出力トークン上限 (daily) */
  dailyOutputLimit: number;
  /** 月コスト上限 (円、Green 帯 mid) */
  monthlyBudgetJpy: number;
  /** Gemini 2.0 Flash 入力コスト ($/1M tokens) */
  inputCostPer1MUsd: number;
  /** Gemini 2.0 Flash 出力コスト ($/1M tokens) */
  outputCostPer1MUsd: number;
  /** 為替レート (円/USD) */
  usdToJpy: number;
}

export const DEFAULT_BUDGET: TokenBudget = {
  dailyInputLimit: 8_000,
  dailyOutputLimit: 800,
  monthlyBudgetJpy: 586,
  inputCostPer1MUsd: 0.075,
  outputCostPer1MUsd: 0.30,
  usdToJpy: 150,
};

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface BudgetCheckResult {
  withinBudget: boolean;
  estimatedCostJpy: number;
  reason?: string;
}

/**
 * 1 回の digest 生成での推定コストを計算し、daily 上限内かチェックする。
 */
export function checkBudget(
  usage: TokenUsage,
  budget: TokenBudget = DEFAULT_BUDGET
): BudgetCheckResult {
  const inputCostUsd =
    (usage.inputTokens / 1_000_000) * budget.inputCostPer1MUsd;
  const outputCostUsd =
    (usage.outputTokens / 1_000_000) * budget.outputCostPer1MUsd;
  const totalCostUsd = inputCostUsd + outputCostUsd;
  const estimatedCostJpy = totalCostUsd * budget.usdToJpy;

  if (usage.inputTokens > budget.dailyInputLimit) {
    return {
      withinBudget: false,
      estimatedCostJpy,
      reason: `Input tokens ${usage.inputTokens} exceeds daily limit ${budget.dailyInputLimit}`,
    };
  }
  if (usage.outputTokens > budget.dailyOutputLimit) {
    return {
      withinBudget: false,
      estimatedCostJpy,
      reason: `Output tokens ${usage.outputTokens} exceeds daily limit ${budget.dailyOutputLimit}`,
    };
  }

  return { withinBudget: true, estimatedCostJpy };
}

/**
 * mock 用: テキストのおよそのトークン数を推定する (4 文字 = 1 token の近似)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * 月次コスト試算 (日次 usage から月 30 日分を推定)
 */
export function estimateMonthlyCostJpy(
  dailyUsage: TokenUsage,
  budget: TokenBudget = DEFAULT_BUDGET
): number {
  const dailyCostUsd =
    (dailyUsage.inputTokens / 1_000_000) * budget.inputCostPer1MUsd +
    (dailyUsage.outputTokens / 1_000_000) * budget.outputCostPer1MUsd;
  return dailyCostUsd * 30 * budget.usdToJpy;
}
