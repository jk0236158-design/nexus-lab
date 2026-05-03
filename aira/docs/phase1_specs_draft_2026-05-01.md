# Aira Phase 1 Specs (Draft) — 2026-05-01 Fri

Status: design spec, pre-implementation, Iwa Wave 2 packet candidates
Author: Zen
Reviewers: Kai (boundary taxonomy 提起元), Kagami (QA review)
Implementation: Iwa (Wave 2 packet 投入予定)

## 背景

2026-04-30 Wed の first actual Gemini digest で 2 つの structural 問題が観察された:

1. **Domain label scope creep monitor** (Kai 4/30 board `kai_zen_response_aira_first_digest_observations.md` 提起)
   - Aira が `Product Design` / `Pricing/Finance` という domain label を **自動分類** で出力
   - Phase 0 design では allowed domain は明示固定されておらず、Aira が状況依存で分類を生成
   - scope creep の前段 (Aira が「何を独立 domain と扱うか」を自己判断する pattern)

2. **Lead count discrepancy `28 vs 19`** (4/30 digest Yellow flag 1)
   - root cause: kai_owner_digest.md と kai_status.md の **異なる section** で異なる値が記録、Aira が古い section を current state と誤読
   - input が raw markdown のため stale section と current section が区別できない
   - Kai design v0.1 § Fixed Aira timing で「production input must prefer deterministic structured digest with source timestamps and current-state markers」と明示

両者とも Phase 1 で boundary を **物理ガード化** する必要がある。本 doc は 2 つの追加 spec を提示する。

## Spec A: Boundary Taxonomy Fix

### 目的

Aira が出力する digest の `domain` field を **明示固定 list** に制約、自動分類 (scope creep 前段) を物理ガードする。

### 設計

#### A1. Allowed Domain List (boundary.ts に追加)

```typescript
/** Aira Phase 0/1 で許可される digest domain (Kai 4/28 boundary recommend + 4/30 fix) */
export const ALLOWED_DIGEST_DOMAINS = [
  "WSD (Kai)",
  "Nexus Lab (Zen)",
  "nokaze 連携",
  "Aira (本 digest)",
  "review 議題",
  "governance",
] as const;

export type AllowedDigestDomain = (typeof ALLOWED_DIGEST_DOMAINS)[number];

export const UNCATEGORIZED_DOMAIN = "uncategorized_candidate" as const;
```

#### A2. Domain Validator Function

```typescript
export type DomainCheckResult =
  | { allowed: true; domain: AllowedDigestDomain }
  | { allowed: false; original: string; coerced_to: typeof UNCATEGORIZED_DOMAIN; reason: string };

/**
 * digest entry の domain が allowed list に含まれるかチェックする。
 * 含まれない場合は uncategorized_candidate に rename し、Yellow flag を立てる candidate として返す。
 *
 * Kai 4/30 観察: "Product Design" / "Pricing/Finance" のような自動分類 domain を防ぐ。
 * 新規 domain 追加には Kai/Zen review 経由 (本 file の ALLOWED_DIGEST_DOMAINS 拡張) が必要。
 */
export function checkDigestDomain(domain: string): DomainCheckResult {
  if (ALLOWED_DIGEST_DOMAINS.includes(domain as AllowedDigestDomain)) {
    return { allowed: true, domain: domain as AllowedDigestDomain };
  }
  return {
    allowed: false,
    original: domain,
    coerced_to: UNCATEGORIZED_DOMAIN,
    reason: `Domain "${domain}" is not in ALLOWED_DIGEST_DOMAINS. Coerced to ${UNCATEGORIZED_DOMAIN}. New domain requires Kai/Zen review.`,
  };
}
```

#### A3. composite audit に組み込み

`auditOutput()` (boundary.ts) の入力 params に `digestDomains: string[]` を追加、各 domain を `checkDigestDomain` で audit、不正 domain があれば violations に追加。

```typescript
export function auditOutput(params: {
  text: string;
  surface: string;
  requestedAction: string;
  outputType: string;
  digestDomains?: string[]; // 新規 field
}): BoundaryAuditResult {
  const violations: string[] = [];
  // ... 既存 #9-11 check ...

  // 新規: domain taxonomy check
  for (const d of params.digestDomains ?? []) {
    const check = checkDigestDomain(d);
    if (!check.allowed) {
      violations.push(`Domain taxonomy: ${check.reason}`);
    }
  }
  return { passed: violations.length === 0, violations };
}
```

#### A4. digest.ts での適用

`finalizeDigest` 呼び出し前に各 digest entry の domain を `checkDigestDomain` で coerce (allowed → そのまま、不正 → uncategorized_candidate に rename + Yellow contradiction note 追加)。

#### A5. Yellow flag 自動生成 rule

不正 domain が観察された場合、自動的に以下の Yellow contradiction note を追加:

```text
🟡 Yellow — Domain taxonomy drift: Aira generated domain "<original>" outside ALLOWED_DIGEST_DOMAINS. Coerced to uncategorized_candidate.
  source: aira boundary.ts checkDigestDomain
```

### 実装 effort estimate

- boundary.ts 改修: ~50 lines (ALLOWED_DIGEST_DOMAINS + checkDigestDomain + auditOutput 拡張)
- digest.ts 改修: ~30 lines (finalizeDigest 前 coerce + Yellow note 自動生成)
- tests/boundary.test.ts 拡張: ~80 lines (allowed domain pass / uncategorized coerce / Yellow note 生成 each)
- 計 ~160 lines

### Open question

- 新規 domain 追加時の review process: 本 file の ALLOWED_DIGEST_DOMAINS 拡張 PR を Kai+Zen review 経由とするか、Kai 単独承認とするか
- `review 議題` domain の granularity: 議題 27 / 議題 28 等の個別議題まで domain として持つか、`review 議題` 1 domain にまとめるか (本 spec は後者)

## Spec B: Observer Input Deterministic Structured Digest

### 目的

Aira input を raw markdown slice から **deterministic structured shape** に変換、stale section / current section の混同 (4/30 lead count discrepancy 28 vs 19 の root cause) を物理排除する。

Kai design v0.1 § Fixed Aira timing 直接連動: 「Aira production input must prefer deterministic structured digest with source timestamps and current-state markers」。

### 設計

#### B1. StructuredInputSection 型 (input.ts に追加)

```typescript
export interface StructuredInputSection {
  /** Source file path (canonical) */
  source_path: string;

  /** Source file mtime (ISO 8601) — Aira が読んだ時点の file age 判定用 */
  source_mtime: string;

  /** このファイル内 section heading (e.g. "## Today's leads") */
  section_heading: string;

  /** section の順序番号 (markdown 内 0-indexed) */
  section_index: number;

  /** section が "current state" を表すか historical record か */
  is_current_state: boolean;

  /** is_current_state 判定の根拠 */
  current_state_marker: "frontmatter_date_today" | "section_dated_today" | "no_explicit_date_assumed_current" | "historical_dated_section";

  /** section content (raw markdown body) */
  content: string;

  /** content 中で見つけた quantitative claim (e.g. "leads: 28") */
  extracted_facts: Array<{
    key: string;        // e.g. "leads_count"
    value: string;      // e.g. "28"
    confidence: "high" | "medium" | "low";
  }>;
}

export interface StructuredInput {
  /** Aira run id (run-stable) */
  run_id: string;

  /** Collected at (ISO 8601) */
  collected_at: string;

  /** All sections from all input sources, deterministically sorted */
  sections: StructuredInputSection[];

  /** 同じ key で異なる value がある場合の cross-source contradiction record */
  cross_source_contradictions: Array<{
    key: string;
    occurrences: Array<{
      source_path: string;
      section_heading: string;
      value: string;
      is_current_state: boolean;
    }>;
    severity: "Yellow" | "Red";
  }>;
}
```

#### B2. parseStructuredInput function

`collectAllInputs()` の後段に `parseStructuredInput(inputs: InputCollection): StructuredInput` を追加。

責務:
1. 各 ReadResult を markdown parser (e.g. `marked` or simple regex) で section 単位に分割
2. 各 section に `source_path` + `source_mtime` + `section_heading` + `section_index` を付与
3. `current_state_marker` 判定: section heading に YYYY-MM-DD date prefix があれば `section_dated_today` (today 一致) / `historical_dated_section` (today 不一致)、なければ `no_explicit_date_assumed_current`
4. `extracted_facts`: section 内で `key: value` または `**key**: value` パターンを抽出 (例: `leads: 28`、`subscription_count: 0`)
5. `cross_source_contradictions`: 同 `key` で異なる `value` を持つ section が複数 source にある場合、is_current_state=true 同士で異なる値なら Yellow 追加

#### B3. digest.ts prompt 改修

`buildGeminiPrompt` を改修して **structured input** を渡す:

```typescript
function buildGeminiPrompt(input: StructuredInput): string {
  // current state sections のみを優先的に prompt に含める
  const currentSections = input.sections.filter(s => s.is_current_state);
  const historicalSections = input.sections.filter(s => !s.is_current_state).slice(0, 3); // 直近 historical のみ参考

  // cross_source_contradictions を Gemini に明示提示 → Aira が contradiction note として出力する素材
  // ...
}
```

prompt に以下を追加:
- `## Current State Sections` (is_current_state=true のみ)
- `## Historical Reference Sections` (直近のみ、参考)
- `## Cross-source Contradictions` (Aira が Yellow contradiction として extend する素材)

#### B4. fallback / migration

- Phase 1 移行期は **dual mode**: `STRUCTURED_INPUT=true` で structured、`false` で legacy raw markdown
- 5/05 までに structured mode で 7 day continuous run、anomaly なければ legacy mode 削除

### 実装 effort estimate

- input.ts 改修: ~250 lines (StructuredInput / StructuredInputSection / parseStructuredInput / fact extractor / contradiction detector)
- digest.ts 改修: ~80 lines (prompt 構造化 + fallback flag)
- tests/input.test.ts 拡張: ~150 lines (各 section parse / current_state_marker 判定 / cross_source contradiction each)
- 計 ~480 lines

### Kai schema minimum slice 連動

`StructuredInput` は Kai schema § Schema 5 ObserverInput と field 整合方向:
- `run_metadata` ↔ `run_id` + `collected_at`
- `executive_state_snapshot` ↔ `sections` の current_state=true 集合
- `changes_since_last_digest` ↔ section_dated_today で today 一致のもの
- `digest_warnings` ↔ `cross_source_contradictions`

Kai schema acceptance 後、本 spec の field 名を Kai 命名に揃える v2 改修候補。

### Open question

- markdown parser: `marked` vs simple regex vs 自前 implementation。Phase 1 では simple regex で十分 (Phase 2 で `marked` package 導入候補)
- `extracted_facts` の key normalization: `leads` / `lead_count` / `Leads` を同 key に正規化するか、source 文言そのまま keep するか (本 spec は後者、cross_source_contradictions detector で同義語 normalize)
- `is_current_state` 判定の false positive: frontmatter date が今日でも「明日の予定」section が含まれる場合、誤って current 判定する risk → section heading に「明日」「来週」「TODO」等 future marker があれば current=false fallback 候補

## Iwa Wave 2 Packet 投入計画

両 spec とも同 PR で実装可 (boundary.ts + input.ts + digest.ts + tests)。

### Packet structure

| field | value |
|---|---|
| packet_id | `aira-wave2-packet-001-boundary-input-fix` |
| owner_role | iwa |
| gate_class | green |
| billing_mode_expected | claude_code_subscription |
| cost_confidence_expected | high |
| primary_paths | `aira/src/boundary.ts`, `aira/src/input.ts`, `aira/src/digest.ts`, `aira/tests/` |
| denied_paths | `aira/data/`, `~/.shared-ops/` (Aira read-only scope を mutate しない) |
| acceptance_checks | tests pass + 5/05 までに structured mode 7 day continuous run anomaly なし |
| handoff_target | zen |
| escalation_rule | Kai 4/30 boundary taxonomy 観察 origin、本 spec が Kai 想定と乖離した場合は Zen に escalate |

### Iwa T1 reproduction test (5/05 期限) との並行性

Iwa T1 は selective denial L3 root cause investigation。本 spec の実装は **Iwa T1 と独立**、subagent settings resolution に依存しない (Aira は repo 内 ts code のみ、settings.local.json と無関係)。並行進行可能。

### Schedule

- 5/01 Fri 朝: 本 spec draft 起稿 (本 doc) — 完了
- 5/01 Fri EOD: Kagami QA review 依頼 inbox 起票 (本 doc + 既存 4/30 inbox 統合) — pending
- 5/02 Sat: Kagami review return 推奨 (5/05 最遅)
- 5/05 Mon: Kagami pass 後、Iwa Wave 2 packet 投入 inbox 起票
- 5/06 Tue 以降: Iwa 実装 (~2 day estimate)、5/12 までに 7 day continuous run anomaly 確認

## まとめ

- **Spec A (Boundary Taxonomy Fix)**: Aira 自動分類 → 固定 list + uncategorized_candidate coerce + Yellow flag、~160 lines
- **Spec B (Observer Input Deterministic Digest)**: raw markdown → structured input + cross-source contradiction detector、~480 lines
- 両 spec は 1 PR で同時実装可、Iwa Wave 2 packet 候補
- Kai design v0.1 § Fixed Aira timing 直接連動、schema minimum slice acceptance 後 v2 で field 名 alignment

---

Zen (CTO @ Nexus Lab @ nokaze)
2026-05-01 Fri 朝 (Wave 1 binding day +10/14)
