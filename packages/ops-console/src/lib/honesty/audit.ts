// Yuino セキュリティ v0 axis 12 v0: Fail Closed (rule-based Honesty audit、 5/07 PM jun directive 「絶対妥協なし」)
// 「迷ったら止まる、 勝手に進みません」 = 公開資料起稿時の literal verification + 数字源 verify + audit report 整合性
// v0 = rule-based (LLM 不使用、 cost 効率 + Kura 独立判断侵食回避)
// trigger 連動 (publish endpoint で middleware 化) は 5/13+ Phase B carry、 v0 は logic + test のみ

export interface HonestyAuditFinding {
  layer: 'literal' | 'source' | 'audit-report';
  severity: 'info' | 'yellow' | 'red';
  message: string;
  matchedToken?: string;
  position?: number;
}

export interface HonestyAuditResult {
  passed: boolean;
  findings: HonestyAuditFinding[];
  summary: string;
}

// Layer A: literal verification
// 数字 token regex (例: 「4 ヶ月」 「100 件」 「¥5000」)
const NUMBER_TOKEN_REGEX = /\d+(\.\d+)?\s*(day|日|時間|ヶ月|月|週間?|分|秒|件|名|円|¥|%|連続|回)/g;

// 期間 token regex (例: 「2026-01-01 から 2026-05-07」)
const DATE_RANGE_REGEX = /\d{4}-\d{2}-\d{2}\s*(から|〜|-)\s*\d{4}-\d{2}-\d{2}/g;

// 誇張 phrase blocklist (memory `feedback_honesty_violation_exaggeration.md` 連動)
const EXAGGERATION_BLOCKLIST = [
  '完成',
  '達成',
  'Done',
  '完了',
  '成功確実',
  '必ず',
  '間違いなく',
  '世界初',
  '業界初',
  '革命',
  '完璧',
];

// source link annotation regex (例: 「source: ledger/2026-05.md#L42」)
const SOURCE_ANNOTATION_REGEX = /source:\s*[\w\-./]+(\.md|\.json)?(#L\d+)?/i;

/**
 * Layer A: literal verification
 * 数字 token + 期間 token を抽出、 各 token に対して source link annotation がない場合は yellow finding。
 */
export function checkLiteralVerification(content: string): HonestyAuditFinding[] {
  const findings: HonestyAuditFinding[] = [];

  // 数字 token 抽出 + source annotation check
  const numberMatches = Array.from(content.matchAll(NUMBER_TOKEN_REGEX));
  for (const match of numberMatches) {
    const token = match[0];
    const position = match.index ?? 0;

    // 該当 token の周辺 200 文字内に source annotation があるか確認
    const contextStart = Math.max(0, position - 100);
    const contextEnd = Math.min(content.length, position + token.length + 100);
    const context = content.slice(contextStart, contextEnd);

    if (!SOURCE_ANNOTATION_REGEX.test(context)) {
      findings.push({
        layer: 'literal',
        severity: 'yellow',
        message: `数字 token 「${token}」 の出典 (source link) が見つかりません`,
        matchedToken: token,
        position,
      });
    }
  }

  // 期間 token 抽出 (将来 source verify connect)
  const dateRangeMatches = Array.from(content.matchAll(DATE_RANGE_REGEX));
  for (const match of dateRangeMatches) {
    findings.push({
      layer: 'literal',
      severity: 'info',
      message: `期間 token 「${match[0]}」 detected、 source verify candidate`,
      matchedToken: match[0],
      position: match.index ?? 0,
    });
  }

  return findings;
}

/**
 * Layer B: 誇張 phrase block (memory `feedback_honesty_violation_exaggeration.md` 連動)
 * blocklist phrase の literal grep + 「reify (北極星未達)」 narrative form の例外検出で red finding 数を decide。
 * 「Phase X reify (北極星未達)」 form は誇張ではないので除外、 「reify」 narrative 不在 + 誇張 phrase 単独使用は red。
 */
export function checkExaggerationPhrases(content: string): HonestyAuditFinding[] {
  const findings: HonestyAuditFinding[] = [];

  // 「reify (北極星未達)」 narrative form がある場合、 誇張 phrase の前後 narrative は OK と判定
  const hasReifyNarrative = /reify\s*\(\s*北極星未達\s*\)/.test(content);

  for (const phrase of EXAGGERATION_BLOCKLIST) {
    const regex = new RegExp(phrase, 'g');
    const matches = Array.from(content.matchAll(regex));
    for (const match of matches) {
      const position = match.index ?? 0;

      // 該当 phrase の周辺 100 文字に 「reify (北極星未達)」 narrative がある場合は除外
      const contextStart = Math.max(0, position - 50);
      const contextEnd = Math.min(content.length, position + phrase.length + 50);
      const context = content.slice(contextStart, contextEnd);

      if (hasReifyNarrative && /reify\s*\(\s*北極星未達\s*\)/.test(context)) {
        continue;
      }

      findings.push({
        layer: 'audit-report',
        severity: 'red',
        message: `誇張 phrase 「${phrase}」 単独使用 detect、 「Phase X reify (北極星未達)」 form を期待`,
        matchedToken: phrase,
        position,
      });
    }
  }

  return findings;
}

/**
 * Layer C: dogfood evidence link check
 * publish 候補 doc に dogfood evidence file path link が含まれない場合は red finding。
 * memory `feedback_publish_before_dogfood_premature.md` 連動。
 */
export function checkDogfoodEvidence(content: string): HonestyAuditFinding[] {
  const findings: HonestyAuditFinding[] = [];

  const dogfoodEvidenceRegex = /dogfood\s*(evidence|run|verify)|aira\/data\/digests\/|nokaze-aira\//i;
  if (!dogfoodEvidenceRegex.test(content)) {
    findings.push({
      layer: 'audit-report',
      severity: 'red',
      message:
        'dogfood evidence file path link が見つかりません。 ' +
        'memory `feedback_publish_before_dogfood_premature.md` 連動: ' +
        '実装完成 + dogfood verify 後 publish ritual 必須。',
    });
  }

  return findings;
}

/**
 * Honesty audit (3 layer 統合):
 *   Layer A: literal verification (数字 token + source annotation)
 *   Layer B: 誇張 phrase block
 *   Layer C: dogfood evidence link check
 *
 * red finding が 1 件でもあれば passed=false (Fail Closed: 「迷ったら止まる」)。
 * yellow finding は jun 1 click bypass で進める想定 (UI 側で reify、 v0 は API 返却のみ)。
 */
export function runHonestyAudit(content: string): HonestyAuditResult {
  const findings: HonestyAuditFinding[] = [
    ...checkLiteralVerification(content),
    ...checkExaggerationPhrases(content),
    ...checkDogfoodEvidence(content),
  ];

  const redCount = findings.filter((f) => f.severity === 'red').length;
  const yellowCount = findings.filter((f) => f.severity === 'yellow').length;
  const infoCount = findings.filter((f) => f.severity === 'info').length;

  const passed = redCount === 0;

  return {
    passed,
    findings,
    summary: `Honesty audit ${passed ? 'PASS' : 'FAIL'}: red ${redCount} / yellow ${yellowCount} / info ${infoCount}`,
  };
}

export const __internal = {
  NUMBER_TOKEN_REGEX,
  DATE_RANGE_REGEX,
  EXAGGERATION_BLOCKLIST,
  SOURCE_ANNOTATION_REGEX,
};
