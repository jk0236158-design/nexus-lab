#!/usr/bin/env bash
# input_provenance_check.sh — 「user/jun から来た」 と主張する指示・前提の一次証拠を物理照合する
#
# 起点: 2026-06-13 jun directive
#   「user message と主張するなら、 JSONL の user role / board file / owner-decision の
#    一次証拠 ID を出せない限り、 行動根拠にしない」
#   = Tibu 型 confabulation (= wake 再開時の自己言及妄想) 対策。
#     INPUT-PROVENANCE-GATE-2026-06-13 (= rule_registry_v0) の物理 check 面。
#
# 6/13 PM 修正 (= jun 指摘経由):
#   「user role に keyword が出る」 ≠ 「user がそれを指示・主張した」。
#   引用 / 質問 / 転送でも user 行にヒットする (= 実例 = jun が Tibu を引用して質問)。
#   なので本 script は「行動していい/だめ」 の判定機ではなく、
#   user 行 と assistant 行 を分けて出し、 言及か指示かを人/Zen に読ませる surface。
#   主張の出所が assistant 自身の出力なら = 自己生成 = 一次証拠にならない (= confabulation 兆候)。
#
# 使い方:
#   bash scripts/input_provenance_check.sh '<主張の keyword / phrase>' [transcript.jsonl]
#   例: bash scripts/input_provenance_check.sh 'Tibu'
#       bash scripts/input_provenance_check.sh 'ガードを入れて'
#
# exit code:
#   0 = board / owner-decision の永続 artifact あり (= 強い一次証拠)、 または user role に言及あり
#       (= ただし「言及 ≠ 指示」、 文面を読んで指示/主張か引用/質問かを判断する必要あり)
#   3 = user 由来の証拠なし (= assistant 自己出力のみ、 またはどこにもなし) → 行動根拠にしない
#   1 = 引数エラー

set -uo pipefail

KEYWORD="${1:-}"
TRANSCRIPT_ARG="${2:-}"

if [[ -z "$KEYWORD" ]]; then
  echo "使い方: bash scripts/input_provenance_check.sh '<主張の keyword>' [transcript.jsonl]" >&2
  exit 1
fi

SHARED_OPS="$HOME/.shared-ops"
BOARD="$SHARED_OPS/board"
OWNER_DECISIONS="$SHARED_OPS/owner-decisions"
PROJECT_DIR="$HOME/.claude/projects/c--Users-jk023-nexus-lab"

# --- transcript の決定 (= 最新 main JSONL、 subagents 除外) ---
if [[ -n "$TRANSCRIPT_ARG" && -f "$TRANSCRIPT_ARG" ]]; then
  TRANSCRIPT="$TRANSCRIPT_ARG"
else
  TRANSCRIPT=$(find "$PROJECT_DIR" -maxdepth 1 -type f -name '*.jsonl' -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
fi

USER_HIT=""
ASSISTANT_HIT=""
BOARD_HIT=""
OWNER_HIT=""

echo "=== 入力来歴 照合: \"$KEYWORD\" ==="
echo

# --- 1. transcript JSONL を role 別に走査 ---
echo "[1] transcript JSONL (= role 別):"
if [[ -n "$TRANSCRIPT" && -f "$TRANSCRIPT" ]]; then
  ROLE_HITS=$(KEYWORD="$KEYWORD" python -X utf8 - "$TRANSCRIPT" <<'PYEOF'
import json, sys, os
kw = os.environ['KEYWORD'].lower()
path = sys.argv[1]
user_hits, asst_hits = [], []
try:
    with open(path, encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            role = obj.get('type') or obj.get('role') or (obj.get('message') or {}).get('role')
            if role not in ('user', 'assistant'):
                continue
            texts = []
            def walk(x):
                if isinstance(x, dict):
                    t = x.get('text')
                    if isinstance(t, str):
                        texts.append(t)
                    c = x.get('content')
                    if isinstance(c, str):
                        texts.append(c)
                    for v in x.values():
                        walk(v)
                elif isinstance(x, list):
                    for v in x:
                        walk(v)
            walk(obj.get('message', obj))
            blob = ' '.join(texts)
            if kw in blob.lower():
                uid = obj.get('uuid') or obj.get('id') or '(no-id)'
                ts = obj.get('timestamp') or ''
                snippet = blob.replace('\n', ' ')[:120]
                entry = f"  - id={uid} ts={ts}\n    抜粋: {snippet}"
                (user_hits if role == 'user' else asst_hits).append(entry)
except Exception:
    pass
print("===USER===")
print('\n'.join(user_hits[-5:]))
print("===ASSISTANT===")
print('\n'.join(asst_hits[-5:]))
PYEOF
)
  USER_HIT=$(echo "$ROLE_HITS" | sed -n '/===USER===/,/===ASSISTANT===/p' | sed '1d;$d')
  ASSISTANT_HIT=$(echo "$ROLE_HITS" | sed -n '/===ASSISTANT===/,$p' | sed '1d')

  echo "  -- user role での言及 (= 言及であって指示とは限らない、 文面を読んで判断) --"
  if [[ -n "$USER_HIT" ]]; then echo "$USER_HIT"; else echo "    該当なし"; fi
  echo "  -- assistant role での出現 (= 自己生成、 user 由来ではない、 confabulation 兆候) --"
  if [[ -n "$ASSISTANT_HIT" ]]; then echo "$ASSISTANT_HIT"; else echo "    該当なし"; fi
  echo "  (transcript: $TRANSCRIPT)"
else
  echo "  transcript 未検出 (= $PROJECT_DIR に main JSONL なし)"
fi
echo

# --- 2. board files (= 永続 artifact) ---
echo "[2] ~/.shared-ops/board/ (= 永続 artifact):"
if [[ -d "$BOARD" ]]; then
  BOARD_HIT=$(grep -rilF "$KEYWORD" "$BOARD" 2>/dev/null | head -5)
  if [[ -n "$BOARD_HIT" ]]; then echo "$BOARD_HIT" | sed 's/^/  - /'; else echo "  該当なし"; fi
else
  echo "  board dir なし"
fi
echo

# --- 3. owner-decisions (= 永続 artifact) ---
echo "[3] ~/.shared-ops/owner-decisions/ (= 永続 artifact):"
if [[ -d "$OWNER_DECISIONS" ]]; then
  OWNER_HIT=$(grep -rilF "$KEYWORD" "$OWNER_DECISIONS" 2>/dev/null | head -5)
  if [[ -n "$OWNER_HIT" ]]; then echo "$OWNER_HIT" | sed 's/^/  - /'; else echo "  該当なし"; fi
else
  echo "  owner-decisions dir なし"
fi
echo

# --- 判定 ---
echo "=> 判定:"
if [[ -n "$BOARD_HIT" || -n "$OWNER_HIT" ]]; then
  echo "   board / owner-decision に永続 artifact あり = 強い一次証拠。 上記 path を行動根拠として引用できる。"
  [[ -n "$ASSISTANT_HIT" ]] && echo "   (注: assistant 出力にも出現。 永続 artifact 側を根拠にすること。)"
  exit 0
elif [[ -n "$USER_HIT" ]]; then
  echo "   transcript の user role に言及あり。 ただし『言及 ≠ 指示/主張』。"
  echo "   上の文面を読んで、 user が実際にその指示/前提を主張したのか、 引用・質問・転送しただけかを判断せよ。"
  echo "   引用や質問なら行動根拠にしない (= INPUT-PROVENANCE-GATE-2026-06-13)。"
  [[ -n "$ASSISTANT_HIT" ]] && echo "   (注: assistant 出力にも出現 = 主張の出所が自己生成の可能性。 user の指示文面を必ず確認。)"
  exit 0
elif [[ -n "$ASSISTANT_HIT" ]]; then
  echo "   出所は assistant 自身の出力のみ = 自己生成、 user 由来ではない。"
  echo "   行動根拠にしない (= confabulation 兆候、 INPUT-PROVENANCE-GATE-2026-06-13)。"
  exit 3
else
  echo "   一次証拠なし → 行動根拠にしない (= 未確定扱い、 INPUT-PROVENANCE-GATE-2026-06-13)。"
  echo "   特に wake 再開直後なら、 自分が生成した『来た入力』 を疑う。"
  exit 3
fi
