import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const SHARED_OPS_PATH =
  process.env.SHARED_OPS_PATH || 'C:\\Users\\jk023\\.shared-ops';

export interface NorthStarChecklistItem {
  step: string;
  done: boolean;
  evidence: string;
}

export interface NorthStarProgress {
  junInterventionFrequencyWeekly: number;
  revenueCoverageRatio: number;
  distanceScore: number;
  fiveStepChecklist: NorthStarChecklistItem[];
  aiBudgetMonthlyConsumption: number;
}

export function getNorthStarProgress(): NorthStarProgress {
  const junFrequency = countJunInterventionWeekly();
  const revenue = 0.0;
  const checklist = buildFiveStepChecklist();
  const distanceScore = computeDistanceScore(junFrequency, revenue);
  const budget = 0.0;

  return {
    junInterventionFrequencyWeekly: junFrequency,
    revenueCoverageRatio: revenue,
    distanceScore,
    fiveStepChecklist: checklist,
    aiBudgetMonthlyConsumption: budget,
  };
}

/**
 * jun 物理介入頻度 (直近 7 day rolling)。
 * 北極星 「jun 介入週 1-2 回」 narrative の measure として:
 *   - board file で from=owner or to=owner (owner 直接 reply / 起稿) のみ計上
 *   - inbox は 「owner-decisions/」 path での起稿のみ計上 (jun 直接 decide、 pending 起票は除外)
 *   - AI 同士の dispatch / Zen-Kai response 系は除外 (Zen-side AI 内部 mention は jun 介入ではない)
 *
 * memory `feedback_yuino_security_axis.md` 連動 = Approval Gate boundary 「External Execute jun 確認必須」 と form 整合。
 */
function countJunInterventionWeekly(): number {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  let count = 0;

  // board: owner_*.md (owner = jun が from or to の file 件数)
  const boardDir = join(SHARED_OPS_PATH, 'board');
  if (existsSync(boardDir)) {
    try {
      const files = readdirSync(boardDir).filter((f) => f.endsWith('.md'));
      for (const filename of files) {
        const name = basename(filename, '.md');
        const parts = name.split('_');
        const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) continue;
        const fileTime = Date.parse(dateMatch[1]);
        if (Number.isNaN(fileTime) || fileTime < sevenDaysAgo) continue;
        // owner = jun が from (parts[1]) or to (parts[2]) の file
        if (parts[1] === 'owner' || parts[2] === 'owner') {
          count += 1;
        }
      }
    } catch {
      // skip
    }
  }

  // owner-decisions: jun 直接 decide のみ (inbox pending 起票は AI-driven、 jun 介入 ≠ 起票件数)
  const decisionsDir = join(SHARED_OPS_PATH, 'owner-decisions');
  if (existsSync(decisionsDir)) {
    try {
      const files = readdirSync(decisionsDir).filter((f) => f.endsWith('.md'));
      for (const filename of files) {
        const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch) continue;
        const fileTime = Date.parse(dateMatch[1]);
        if (Number.isNaN(fileTime) || fileTime < sevenDaysAgo) continue;
        count += 1;
      }
    } catch {
      // skip
    }
  }

  return count;
}

function buildFiveStepChecklist(): NorthStarChecklistItem[] {
  const airaImplPath = 'C:\\Users\\jk023\\Desktop\\nokaze-aira';
  const dogfoodDone = existsSync(airaImplPath);

  const polarDone = false;

  const setupMemoCandidates = [join(SHARED_OPS_PATH, 'inbox')];
  const setupMemoDone = setupMemoCandidates.some((dir) => {
    if (!existsSync(dir)) return false;
    try {
      const files = readdirSync(dir).filter((f) =>
        f.toLowerCase().includes('setup_memo') ||
        f.toLowerCase().includes('setup-memo'),
      );
      return files.length > 0;
    } catch {
      return false;
    }
  });

  const workflowDone = false;
  const measureDone = false;

  return [
    {
      step: 'Yuino dogfood (実装 + 本格使用)',
      done: dogfoodDone,
      evidence: dogfoodDone
        ? 'nokaze-aira repo 存在 (Kai 主導 commit 済)'
        : 'nokaze-aira repo 不在',
    },
    {
      step: 'Polar.sh (商品販売基盤)',
      done: polarDone,
      evidence: 'Phase 1.5 で integration 予定',
    },
    {
      step: 'Setup Memo (商品 setup 手順)',
      done: setupMemoDone,
      evidence: setupMemoDone
        ? 'inbox に setup_memo file 存在'
        : 'setup memo 起票待ち',
    },
    {
      step: 'weekly workflow (週次運用 form)',
      done: workflowDone,
      evidence: '週次 cadence 設計待ち',
    },
    {
      step: '5/31 measure (月末計測)',
      done: measureDone,
      evidence: '5/31 時点で再計測',
    },
  ];
}

function computeDistanceScore(
  junFrequency: number,
  revenue: number,
): number {
  let interventionScore: number;
  if (junFrequency <= 2) {
    interventionScore = 100;
  } else if (junFrequency <= 10) {
    interventionScore = 100 - ((junFrequency - 2) / 8) * 100;
  } else {
    interventionScore = 0;
  }

  const revenueScore = Math.max(0, Math.min(1, revenue)) * 100;

  return Math.round(interventionScore * 0.5 + revenueScore * 0.5);
}
