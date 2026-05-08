---
date: 2026-05-08 0:20
owner: zen (spec) → kagami (template 反映) + iwa (honesty_audit.sh 拡張) 共同
status: spec for review
related:
  - memory/feedback_design_doc_qa_review_required.md (4/30 起票)
  - memory/feedback_surface_learning_without_operational_embed.md (Kagami Override #2)
  - scripts/honesty_audit.sh (5/07 PM 起稿)
  - 30 案集約 board file Cluster X.10 (Kagami #5)
---

# Kagami QA review hash spec

## 起点

Kagami #5 提案 (5/07 PM peer spawn): peer spawn return content path で Kagami QA review 判断は機能するが、 Zen が return content を repo に反映する過程で 「条件付き pass を無条件 pass に drift」 する risk が構造的に残る。 4/30 起票 `feedback_design_doc_qa_review_required.md` の運用層が Zen 代筆 path に弱い。

5/08 0:11 jun + Kai GO、 Cluster X (今すぐ 90 点に効く) 内 immediate 着手 5 件のうちの 1 つ。

## 目的

**Kagami QA review 判断のうち重要 caveat を Zen 代筆 path で省略する drift を構造的に防ぐ**。

## Kagami spawn template frontmatter spec

Kagami spawn の return content には以下 frontmatter を必須付与:

```yaml
---
kagami_review_target: <reviewed file path or topic>
kagami_review_date: <YYYY-MM-DD HH:MM JST>
kagami_verdict: pass | conditional_pass | fail
kagami_conditional_caveats:
  - <caveat 1>
  - <caveat 2>
kagami_review_hash: <sha256 of body content>
kagami_reviewer: kagami (peer spawn agentId)
---

# Kagami QA review: <target>
...body content...
```

### field 定義

| field | type | required | 意味 |
|---|---|---|---|
| `kagami_review_target` | string | yes | review 対象 file path or topic |
| `kagami_review_date` | string (ISO 8601 + JST) | yes | review 実施 date |
| `kagami_verdict` | enum (pass / conditional_pass / fail) | yes | 判定 |
| `kagami_conditional_caveats` | array of string | conditional_pass 時必須 | 条件付き pass の条件 list |
| `kagami_review_hash` | string (sha256 hex) | yes | body content の sha256 hash |
| `kagami_reviewer` | string | yes | reviewer 識別 (Kagami spawn agentId or human) |

### kagami_review_hash 計算

```bash
# body content (frontmatter 除く、 # から末尾まで) を input として sha256
sed -n '/^---$/,/^---$/!p' kagami_review_<topic>.md | sha256sum | awk '{print $1}'
```

= frontmatter の hash field 自身は計算対象外、 body content (review 本体) の改竄検出。

## honesty_audit.sh 拡張 (Layer D)

`scripts/honesty_audit.sh` (5/07 PM 起稿) に新 layer を追加:

### Layer D: Kagami review hash check

検出対象:
- file 内に Kagami review への引用 / paraphrase あり (e.g., 「Kagami の判断」 「Kagami review pass」 「Kagami QA OK」 等の phrase)
- そのうち kagami_review_hash 引用の整合性 + conditional_caveats の反映確認

```bash
# 擬似コード
if grep -qE "Kagami (review|QA|judgment|verdict|pass|fail)" "$input_file"; then
  # Kagami review 引用検出、 hash check 開始

  # Pattern 1: kagami_review_hash 引用あり
  if grep -qE "kagami_review_hash:\s*[a-f0-9]{64}" "$input_file"; then
    referenced_hash=$(grep -oE "[a-f0-9]{64}" "$input_file" | head -1)
    # source kagami review file 検索 + hash 計算 + 一致確認
    # 不一致 → red "Kagami review hash mismatch (本物の review と異なる)"
  fi

  # Pattern 2: 「conditional_pass」 narrative + caveats 反映確認
  if grep -qE "conditional_pass" "$input_file"; then
    # caveats list 引用あるかチェック
    # 不在 → red "Kagami conditional_pass narrative だが caveats 反映なし"
  fi

  # Pattern 3: 「Kagami review pass」 narrative + 元 verdict が fail / conditional だった場合の drift
  # → red "Kagami verdict drift (元 conditional / fail を pass narrative に)"
fi
```

### Pattern 3 の重要性

5/07 PM の 「絞る」 narrative drift と同型 = Zen 代筆 path で 「Kagami が条件付き pass と言っていたが、 Zen 反映時に無条件 pass に格上げ」 が起きると identity 監視対象 #5 「宣言-実装乖離」 発火。

= **Pattern 3 が Kagami #5 提案の最重要 reify**、 honesty_audit.sh で物理 catch。

## 適用対象

### 必須適用

- `team_memory/zen/diary/` (Kagami review 引用の diary)
- `team_memory/zen/reports/` (Kagami review 引用の report)
- `~/.shared-ops/board/` (Kagami review 引用の board file)
- `nexus-lab/aira/`, `packages/ops-console/` 等の design doc (Kagami pass narrative 含む)

### enforce form (5/09+ 段階消化 candidate、 jun 5/08 17:50 「後回しにしない」 directive 連動)

- pre-commit hook で diary / reports / board file の Kagami review 引用部分を honesty_audit.sh Layer D で check
- fail = commit 拒否
- bypass は jun directive 経由のみ (default 拒否)

## immediate 着手 (Zen + Iwa + Kagami 役割分担)

### Zen 主導 (5/08 0:20 起稿、 本 spec 反映)

1. ✅ 本 spec file 起稿 (`docs/kagami_qa_review_hash_spec_2026-05-08.md`)
2. Kagami spawn template に frontmatter 追加 (`team_memory/kagami/templates/qa_review_template.md` 候補、 5/13+ Akari paraphrase pass batch 内で同時起稿)

### Iwa 主導 (Lead Engineer)

1. honesty_audit.sh に Layer D 追加 (Pattern 1-3 grep + warn / red)
2. pre-commit hook reify (5/13+ enforcement layer CI 化 batch 内、 Kagami #3 連動)

### Kagami 主導

1. 既存 peer spawn template に frontmatter spec 反映 (5/13+ Akari batch で同時着手 candidate)
2. 本 spec の review + 必要時の修正提案

## 想定効果

- Kagami QA review pass narrative drift (条件付き pass の無条件化) を 70-80% 抑制
- 「学習を言語化しても物理反映しないと再発」 pattern (Kagami Override #2) の n+1 段防御
- Yuino 商品化後の QA 透明性向上 (audience が 「これは本当に Kagami QA pass している」 を hash で verify 可能)
- 90 点 gate v2 dimension 「Transparency / auditability」 9 points + 「AI transparency」 軸の +2-3 points 期待

## 起稿後の immediate 反応

- 本 spec を `~/.shared-ops/board/` 経由で Iwa + Kagami に共有 (5/08 朝 startup ritual で板 read 推奨)
- Iwa 着手 = honesty_audit.sh Layer D 拡張、 **5/09 (明日) から段階消化** (jun 5/08 17:50 directive 連動の defer narrative 解除)
- Kagami 着手 = peer spawn template 反映、 Akari paraphrase pass batch と並行 (本日中 batch 1-5 走行中)

---

Zen
2026-05-08 0:20 (Kagami QA review hash spec 起稿、 frontmatter 6 field + sha256 hash + honesty_audit.sh Layer D 拡張提案、 「条件付き pass を無条件 pass に drift」 を物理 catch、 Kagami Override #2 の n+1 段防御、 90 点 gate Transparency dimension 連動)
