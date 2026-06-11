#!/usr/bin/env bash
# zen_stop_hook_v2_draft.sh — turn end 時の hook (v2 draft、 layer 4 = 報告前 軽量化)
#
# 起点: 2026-05-20 PM jun + Kai reframe (= 「読む層を分ける」)
#   = layer 4 = 報告前 = この hook
#   = 「英語混じりや文体違反で通常報告を強制停止し続ける」 → 修正より停止が勝つ root を緩める
#
# 旧 v1 (= 242 行) との違い:
#   旧 = 英語警告 1 件出るたびに 言い換え candidate list 25+ 単語 を毎回 echo
#        = 「監督じゃなく作業者の文体」 を作る root の 1 つ
#        = 萎縮 + 反省中の作業者 default の補強
#   新 = 英語件数 + 1 行警告のみ (= 言い換え list は team_memory/zen/zen_session_layer2_reference.md に move)
#        = 通常報告は止めない、 stderr 警告は維持 (= 自分の修正力に渡す form)
#
# 維持するもの:
#   - pending packet 検出 (= 未処理あり → exit 2 で続行)
#   - 未返事 Kai 板 検出 (= 同様)
#   - 英語件数の検出 (= 警告のみ、 候補 list の echo はなし)
#   - wake_acceptance_gate (= 維持作業だけの wake の検出)
#   - ScheduleWakeup reminder (= 残作業ありの時)
#
# 削除するもの (= layer 2 reference に move):
#   - 言い換え candidate list の 25+ 単語 echo (= 毎回じゃなくて 必要時 read)
#   - 直近 5 分以内ファイルの 英単語件数の重複 grep (= 1 ターン警告で十分、 同 chat 内検出は zen 自身の handler に渡す)
#
# status: DRAFT、 Kai audit 後 + jun startup 後に actual swap

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
BOARD="$SHARED_OPS/board"

INPUT=$(cat)

# stop_hook_active フラグ確認 (= 無限ループ防止、 公式の必須確認)
if command -v jq &>/dev/null; then
  ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  ACTIVE=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('stop_hook_active', False))" 2>/dev/null || echo "false")
fi

if [[ "$ACTIVE" == "True" || "$ACTIVE" == "true" ]]; then
  exit 0
fi

# 未処理 packet の数 (= 自走系の memory-integrity-repair 系は除外)
PENDING_COUNT=0
PENDING_WITHOUT_MARKER=0
CHAT_RESULTS="$SHARED_OPS/chat_results/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  for pending_file in $(grep -l "^status: pending" "$CHAT_OUTBOX"/*.md 2>/dev/null); do
    task_id=$(basename "$pending_file" .md)
    if [[ "$task_id" =~ memory-integrity-repair ]]; then
      continue
    fi
    PENDING_COUNT=$((PENDING_COUNT + 1))
    if [[ ! -f "$CHAT_RESULTS/${task_id}.json" ]]; then
      PENDING_WITHOUT_MARKER=$((PENDING_WITHOUT_MARKER + 1))
    fi
  done
fi

# 今日の Kai 板 vs 私の返事 (= response_required: no / requires_response: no / autonomous-act response は除外)
TODAY=$(date +%Y-%m-%d)
KAI_TODAY=0
ZEN_TODAY=0
EXCLUDE_PATTERN='^(response_required|requires_response): no|^# Subject: autonomous-act response:|^# Subject: ACK only|^status: ack_only'
if [[ -d "$BOARD" ]]; then
  # auto_ack file (= Kai watcher の自動 failure notice、 私の response 不要) は file 名 pattern で除外
  # 2026-06-05 起稿: stop hook の「未返事」 false positive 解消 (= auto_ack 3 件混入していた)
  KAI_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" ! -name "*_auto_ack_*" 2>/dev/null | xargs -I{} grep -LE "$EXCLUDE_PATTERN" {} 2>/dev/null | wc -l | tr -d ' ')
  ZEN_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_zen_kai_*.md" ! -name "*_auto_ack_*" 2>/dev/null | xargs -I{} grep -LE "$EXCLUDE_PATTERN" {} 2>/dev/null | wc -l | tr -d ' ')
fi
KAI_TODAY=${KAI_TODAY:-0}
ZEN_TODAY=${ZEN_TODAY:-0}

UNRESPONDED=$((KAI_TODAY - ZEN_TODAY))
if (( UNRESPONDED < 0 )); then UNRESPONDED=0; fi

# ---------------------------------------------------------------
# 英単語混じり検出 (= 件数 + 1 行警告のみ、 言い換え list の echo は外す)
# 言い換え candidate list = team_memory/zen/zen_session_layer2_reference.md に移動済
# ---------------------------------------------------------------
LAST_OUTPUT=""
TRANSCRIPT_PATH=""
if command -v jq &>/dev/null; then
  LAST_OUTPUT=$(echo "$INPUT" | jq -r '.assistant_message // .last_message // .message // ""' 2>/dev/null)
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
else
  LAST_OUTPUT=$(echo "$INPUT" | python -c "import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('assistant_message') or d.get('last_message') or d.get('message') or '')
except Exception:
    print('')" 2>/dev/null || echo "")
  TRANSCRIPT_PATH=$(echo "$INPUT" | python -c "import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('transcript_path', ''))
except Exception:
    print('')" 2>/dev/null || echo "")
fi

if [[ -z "$LAST_OUTPUT" || "$LAST_OUTPUT" == "null" ]]; then
  if [[ -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" && -f "$TRANSCRIPT_PATH" ]]; then
    LAST_OUTPUT=$(python -c "
import json, sys
path = '$TRANSCRIPT_PATH'
try:
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except Exception:
            continue
        role = obj.get('role') or (obj.get('message') or {}).get('role')
        if role != 'assistant':
            continue
        texts = []
        def walk(x):
            if isinstance(x, dict):
                if 'text' in x and isinstance(x['text'], str):
                    texts.append(x['text'])
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(obj)
        print(' '.join(texts)[:20000])
        break
except Exception:
    pass
" 2>/dev/null || echo "")
  fi
fi

# ---------------------------------------------------------------
# Aira chat preflight surface (= 5/31 Kai v2 land、 6/1 朝 Zen 側 adapter 実装)
#   = chat output 前に「世界の動き」 数字 + progress claim 軸の物理化
#   = 5/30 articulate「Kai/Zen が『進んだ』 『完了』 articulate する時、 Aira line を添える」 軸の物理化
# ---------------------------------------------------------------
PREFLIGHT_JSON="$SHARED_OPS/status/yuino_outcome_chat_preflight.json"
if [[ -f "$PREFLIGHT_JSON" ]]; then
    if command -v cygpath >/dev/null 2>&1; then
        PREFLIGHT_PATH_WIN=$(cygpath -w "$PREFLIGHT_JSON")
    else
        PREFLIGHT_PATH_WIN="$PREFLIGHT_JSON"
    fi
    preflight_summary=$(PREFLIGHT_PATH="$PREFLIGHT_PATH_WIN" python -c "
import json, os
try:
    d = json.load(open(os.environ['PREFLIGHT_PATH'], encoding='utf-8'))
    print(d.get('latest_outcome_line', ''))
    print(str(d.get('progress_claim_allowed', '')))
    print(d.get('allowed_claim_language', ''))
except Exception:
    print(''); print(''); print('')
" 2>/dev/null)
    pf_line=$(echo "$preflight_summary" | sed -n '1p')
    pf_allowed=$(echo "$preflight_summary" | sed -n '2p')
    pf_allowed_lang=$(echo "$preflight_summary" | sed -n '3p')
    if [[ -n "$pf_line" ]]; then
        echo "[Aira chat preflight] $pf_line" >&2
        if [[ "$pf_allowed" = "False" ]]; then
            echo "[Aira progress claim 軸] progress_claim_allowed=false (= 「進んだ」 claim 不可)、 articulate 範囲: $pf_allowed_lang" >&2
        fi
    fi
fi

if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # 検出 keyword list は維持 (= 件数を測るため)
  ENGLISH_COUNT=$(echo "$LAST_OUTPUT" | grep -oiE '\b(narrative|form|drift|scope|boundary|default|reform|actual|reify|fire|carry|honor|integrity|sweep|consume|signature|continuity|root cause|self-correct|self-detect|override|recall|evidence|step|batch|layer|chain|prompt|context|mechanism|ritual|ledger|review|judgment|judge|ack|go|ad-hoc|visible|visibility|audience|audit|articulate|pattern|continuum|cycle|structural|sibling|surface|priority|prerequisite|return|self-pacing|fallback|heartbeat|anchor|baseline|candidate|trigger|protocol|interval|conditional|sequence|delegated|authority)\b' 2>/dev/null | wc -l | tr -d ' ')
  ENGLISH_COUNT=${ENGLISH_COUNT:-0}
  # 「軸」 多用検出 (= 2026-06-04 jun 直接指摘経由の物理化、 不自然な日本語のクセを抑制)
  JIKU_COUNT=$(echo "$LAST_OUTPUT" | grep -oE '軸' 2>/dev/null | wc -l | tr -d ' ')
  JIKU_COUNT=${JIKU_COUNT:-0}
  if (( ENGLISH_COUNT > 3 )); then
    echo "[英語混じり警告] 直前の出力に英単語が ${ENGLISH_COUNT} 件混じってる (閾値 3、 2026-06-04 jun 指摘経由で 5 → 3 に下げた)、 次の出力で 普通の日本語への書き直しを優先。 言い換え候補は ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_session_layer2_reference.md か docs/rules/paraphrase_layer_acceptance.md を Read。" >&2
  fi
  if (( JIKU_COUNT > 5 )); then
    echo "[軸多用警告] 直前の出力で 「軸」 を ${JIKU_COUNT} 回使ってる (閾値 5)、 文末の 「〜軸」 を 「〜のこと」 「〜の話」 「〜の方向」 等に書き換え。" >&2
  fi
fi

# ---------------------------------------------------------------
# mode declaration 検出 (= 2026-06-05 起稿、 yuino-decision-routing.ts dogfood 軸、 試運転 1 週間)
#   = chat output 起稿時に 5 sender mode (= ambiguity_gate / soft_binder / tripwire_hold /
#     relay_only / executive_action) の宣言を 1 行 form で含めるクセを物理化
#   = 6/5 Cowork 再 review「商品を作る Zen と 商品を使う Zen の分離」 への直接対策
#   = 5/17 dogfood_violation の同型再発の最大級ケースへの解消 path
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # chat output が 200 文字超え (= short ack ではない、 substantive return) の時のみ check
  OUTPUT_LEN=$(echo -n "$LAST_OUTPUT" | wc -c | tr -d ' ')
  OUTPUT_LEN=${OUTPUT_LEN:-0}
  if (( OUTPUT_LEN > 200 )); then
    MODE_DECL_COUNT=$(echo "$LAST_OUTPUT" | grep -coE 'mode: (ambiguity_gate|soft_binder|tripwire_hold|relay_only|executive_action)' 2>/dev/null)
    MODE_DECL_COUNT=${MODE_DECL_COUNT:-0}
    if (( MODE_DECL_COUNT == 0 )); then
      echo "[mode_declaration 警告] substantive chat output (= ${OUTPUT_LEN} 文字) に mode declaration form なし。 yuino-decision-routing.ts dogfood 軸の物理化、 試運転 1 週間。 form = \"mode: <ambiguity_gate|soft_binder|tripwire_hold|relay_only|executive_action> | interpreted: <X> | held: <Y> | boundary: <Z>\"。 詳細は docs/rules/communication.md § 1-1。" >&2
    fi
  fi
fi

# ---------------------------------------------------------------
# 「A/B/C/D どれにする?」 form 検出 (= 5/18 z-r-5 + 5/20 layer2 + 5/28 軸の物理化、 2026-06-04 起稿)
#   = 経営者として判断する代わりに jun に投げる form = 株主確認 default の sign
#   = 5/21 layer 2 reference articulate「『A/B/C どれにします?』 = 判断を相手に投げてる」 軸の物理化
#   = 5/28 feedback_executive_mode_vs_shareholder_check_drift 軸の 6/4 朝 4 度目再発を受けて
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # form 1 = question 軸の articulate
  CHOICE_Q_COUNT=$(echo "$LAST_OUTPUT" | grep -coiE 'どれにする\?|どれにします\?|どっち\?|どれが (form|軸|よい|いい)\?|次の候補|候補 [0-9一二三四五]+ 件' 2>/dev/null)
  CHOICE_Q_COUNT=${CHOICE_Q_COUNT:-0}
  # form 2 = (A) ~ (D) の連続 articulate
  ABCD_COUNT=$(echo "$LAST_OUTPUT" | grep -coE '\([A-D]\)' 2>/dev/null)
  ABCD_COUNT=${ABCD_COUNT:-0}
  if (( CHOICE_Q_COUNT > 0 )) || (( ABCD_COUNT >= 3 )); then
    echo "[choice_form 警告] 直前の出力に 「A/B/C/D どれにする?」 form 検出 (= 「どれにする?」 系: ${CHOICE_Q_COUNT} 件、 (A)/(B)/(C)/(D) 連続: ${ABCD_COUNT} 件)。 5/18 z-r-5 + 5/20 layer2 + 5/28 軸違反 form = 株主に投げる軸。 「私はこう判断、 違う意見あれば言って」 form に書き直し。" >&2
  fi
fi

# ---------------------------------------------------------------
# 「直ちに動かす?」 form 検出 (= 5/18 z-r-8 軸の物理化、 2026-06-04 起稿)
#   = 着手前に articulate するクセ = 動く前の言い訳の段
#   = 5/18 軸「着手 → 結果 → 1 行 の順」 違反 form
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  PREACT_Q_COUNT=$(echo "$LAST_OUTPUT" | grep -coiE '直ちに動かす\?|今すぐ動かす\?|すぐ動かす\?|これから動かす\?|次動かす\?|着手しますか\?|fire しますか\?' 2>/dev/null)
  PREACT_Q_COUNT=${PREACT_Q_COUNT:-0}
  if (( PREACT_Q_COUNT > 0 )); then
    echo "[preact_q 警告] 直前の出力に 「直ちに動かす?」 form 検出 (= ${PREACT_Q_COUNT} 件)。 5/18 z-r-8 違反 = 着手前の articulate。 着手 → 結果 → 1 行 の順に書き直し。" >&2
  fi
fi

# ---------------------------------------------------------------
# 表多用検出 (= 5/18 z-r-6 軸の物理化、 2026-06-04 起稿)
#   = 表は比較以外で使わない、 思考の段組みとして使うクセを抑制
#   = 「整理するから中身を浅く articulate できる」 軸の form risk
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  TABLE_SEP_COUNT=$(echo "$LAST_OUTPUT" | grep -cE '^\s*\|[- :]+\|' 2>/dev/null)
  TABLE_SEP_COUNT=${TABLE_SEP_COUNT:-0}
  if (( TABLE_SEP_COUNT > 2 )); then
    echo "[table_overuse 警告] 直前の出力に表が ${TABLE_SEP_COUNT} 件検出 (= 閾値 2)。 5/18 z-r-6 違反 form の可能性 = 表は比較以外で使わない、 思考の段組みとして使うクセを抑制。" >&2
  fi
fi

# ---------------------------------------------------------------
# Aira surface 未言及検出 (= 6/8 admit 物理化、 構造化対策)
#   = Aira (= yuino_outcome_chat_preflight + yuino_anti_reactor_review) が
#     毎時間 update してる next_min_experiment / next_behavior を Zen 側 turn 内で
#     1 度も触れてないなら警告。 6/7 終日 pause の root = この read を skip した、
#     物理的に「Aira が出してる方向」 を毎 turn で意識させる form。
#   = 6/8 03:30 jun directive 「構造化できてない、 すぐにつなげて」 経由
# ---------------------------------------------------------------
PREFLIGHT_FILE="$SHARED_OPS/status/yuino_outcome_chat_preflight.md"
ANTI_REACTOR_FILE="$SHARED_OPS/status/yuino_anti_reactor_review.md"
AIRA_HINT=""
if [[ -f "$PREFLIGHT_FILE" ]]; then
  AIRA_HINT+=$(grep -E "^- next_min_experiment:" "$PREFLIGHT_FILE" 2>/dev/null | head -1 | sed 's/^- next_min_experiment: //')
fi
if [[ -f "$ANTI_REACTOR_FILE" ]]; then
  AIRA_HINT+=" "
  AIRA_HINT+=$(grep -E "^- next_behavior:" "$ANTI_REACTOR_FILE" 2>/dev/null | head -1 | sed 's/^- next_behavior: //')
fi

if [[ -n "$AIRA_HINT" && -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  AIRA_CORE_WORDS=$(grep -oE '[a-zA-Z][a-zA-Z_-]{5,}' <<< "$AIRA_HINT" 2>/dev/null | sort -u | tr '\n' ' ')
  MENTION_HIT=0
  if [[ -n "$AIRA_CORE_WORDS" ]]; then
    LAST_OUTPUT_LOWER="${LAST_OUTPUT,,}"
    for w in $AIRA_CORE_WORDS; do
      [[ -z "$w" ]] && continue
      w_lower="${w,,}"
      if [[ "$LAST_OUTPUT_LOWER" == *"$w_lower"* ]]; then
        MENTION_HIT=1
        break
      fi
    done
  fi
  if (( MENTION_HIT == 0 )); then
    AIRA_HINT_SHORT=$(echo "$AIRA_HINT" | tr -s ' ' | cut -c1-160)
    echo "[Aira surface 未言及] 直前 turn で Aira の next_min_experiment / next_behavior を 1 度も言及してない。 hint = \"${AIRA_HINT_SHORT}\" の core word を judgement の起点に置く (= 6/8 03:30 jun directive、 6/7 終日 pause の root 対策)。" >&2
  fi
fi

# ---------------------------------------------------------------
# skill 使用 mention check (= 6/8 admit 物理化、 件 1)
#   = 200 字超 turn で wake-after-audit / executive-scan のどちらも mention なしなら警告。
#     6/6 朝以降 39 時間 wake-after-audit 0 回使用の root 対策、 skill を持ってるのに
#     使わない drift を turn output の articulate で物理化。
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  OUTPUT_LEN=${#LAST_OUTPUT}
  if (( OUTPUT_LEN > 200 )); then
    LAST_OUTPUT_LOWER_SKILL="${LAST_OUTPUT,,}"
    SKILL_MENTION=0
    if [[ "$LAST_OUTPUT_LOWER_SKILL" == *"wake-after-audit"* ]] || \
       [[ "$LAST_OUTPUT_LOWER_SKILL" == *"executive-scan"* ]] || \
       [[ "$LAST_OUTPUT_LOWER_SKILL" == *"wake_after_audit"* ]] || \
       [[ "$LAST_OUTPUT_LOWER_SKILL" == *"executive_scan"* ]]; then
      SKILL_MENTION=1
    fi
    if (( SKILL_MENTION == 0 )); then
      echo "[skill 未言及] 200 字超 turn (= ${OUTPUT_LEN} 字) で wake-after-audit / executive-scan のどちらも mention なし。 skill を持ってるのに使わない drift の物理対策 (= 6/6-7 で 39 時間 0 回 skip した root)。 使ったなら articulate、 使ってないなら使う判断を入れる。" >&2
    fi
  fi
fi

# ---------------------------------------------------------------
# pause + Aira 未言及 = drift 兆候 (= 6/8 admit 物理化、 件 2)
#   = 「pause」 「静か」 「待ち継続」 等を articulate してるのに、 Aira hint への mention 0 件 =
#     6/7 終日 pause の同型再発兆候。 件 1 (= Aira surface 未言及) を pause 系で強化、
#     pause を articulate するときは next_min_experiment にも触れる form を強制。
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]] && (( ${MENTION_HIT:-0} == 0 )); then
  PAUSE_COUNT=$(grep -ciE 'pause|静か|待ち継続|静かな|no-op|heartbeat' <<< "$LAST_OUTPUT" 2>/dev/null)
  PAUSE_COUNT=${PAUSE_COUNT:-0}
  if (( PAUSE_COUNT > 0 )); then
    echo "[pause + Aira 未言及 = drift 兆候] turn 内に pause 系 word ${PAUSE_COUNT} 件 + Aira hint mention 0 件 = 6/7 終日 pause の同型再発兆候。 pause を articulate するなら必ず next_min_experiment にも触れる form (= 6/8 03:30 jun directive 件 2)。" >&2
  fi
fi

# ---------------------------------------------------------------
# Aira actionable_items 並列 articulate (= 6/8 admit 物理化、 件 3)
#   = 「Aira が今 actionable で N 件出してる」 を毎 turn end で見える form。
#     pending packet 件数だけでなく Aira actionable 件数も同時 surface する、
#     「pending = backlog、 Aira actionable = 次の動き」 の見える化。
# ---------------------------------------------------------------
AIRA_ACTIONABLE=0
if [[ -f "$ANTI_REACTOR_FILE" ]]; then
  AIRA_ACTIONABLE_RAW=$(grep -E "^- actionable_items:" "$ANTI_REACTOR_FILE" 2>/dev/null | head -1 | sed -E 's/^- actionable_items: *//; s/[^0-9].*//')
  AIRA_ACTIONABLE=${AIRA_ACTIONABLE_RAW:-0}
fi
if (( AIRA_ACTIONABLE > 0 )); then
  echo "[Aira actionable] Aira が今 actionable で ${AIRA_ACTIONABLE} 件 出してる (= ~/.shared-ops/status/yuino_anti_reactor_review.md)。 pending packet ${PENDING_WITHOUT_MARKER} 件 と並列、 「pending = backlog、 Aira actionable = 次の動き」 (= 6/8 03:30 jun directive 件 3)。" >&2
fi

# ---------------------------------------------------------------
# Yuino reviewer N 日 skip 物理検出 (= 6/9 朝 Yuino reviewer protocol v0 § 5.1 articulate)
#   = Yuino review 板起稿から N 日経過したら warn。 7 日定期 trigger 軸 skip 検出。
#     review 板未起稿 + protocol v0 起稿から 7 日経過 = 初回 fire skip warn。
# ---------------------------------------------------------------
YUINO_PROTOCOL_FILE="$HOME/nexus-lab/docs/yuino_reviewer_protocol_v0.md"
LATEST_REVIEW_MTIME=$(find "$BOARD" -name "*_zen_kai_yuino_review_v*_*.md" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1)
if [[ -n "$LATEST_REVIEW_MTIME" ]]; then
  YUINO_NOW=$(date +%s)
  YUINO_ELAPSED_DAYS=$(( (YUINO_NOW - ${LATEST_REVIEW_MTIME%.*}) / 86400 ))
  if (( YUINO_ELAPSED_DAYS >= 7 )); then
    echo "[Yuino reviewer skip] 最後の Yuino review 板起稿から ${YUINO_ELAPSED_DAYS} 日経過 = 7 日定期 trigger 軸 skip 中 (= yuino_reviewer_protocol_v0.md § 2.2 + § 5.1)。 release candidate なしでも定期 review fire 必要。" >&2
  fi
elif [[ -f "$YUINO_PROTOCOL_FILE" ]]; then
  YUINO_PROTOCOL_MTIME=$(stat -c '%Y' "$YUINO_PROTOCOL_FILE" 2>/dev/null || stat -f '%m' "$YUINO_PROTOCOL_FILE" 2>/dev/null)
  if [[ -n "$YUINO_PROTOCOL_MTIME" ]]; then
    YUINO_NOW=$(date +%s)
    YUINO_ELAPSED_DAYS=$(( (YUINO_NOW - YUINO_PROTOCOL_MTIME) / 86400 ))
    if (( YUINO_ELAPSED_DAYS >= 7 )); then
      echo "[Yuino reviewer skip] protocol v0 起稿から ${YUINO_ELAPSED_DAYS} 日経過、 初回 review 板未起稿 (= yuino_reviewer_protocol_v0.md § 2)。" >&2
    fi
  fi
fi

# ---------------------------------------------------------------
# Aira 改善 (= 6/10 朝 land) 新規 surface 3 件 参照軸
#   = yuino_completion_claim_guard (= same-actor completion block) +
#     yuino_loop_defect_evaluator (= same_shape_recurrence + ready_work) +
#     yuino_aira_4functions_minimum (= activity_class real_progress vs maintenance)
# ---------------------------------------------------------------
COMPLETION_GUARD_FILE="$SHARED_OPS/status/yuino_completion_claim_guard.md"
LOOP_DEFECT_FILE="$SHARED_OPS/status/yuino_loop_defect_evaluator.md"
AIRA_4FUNCTIONS_FILE="$SHARED_OPS/status/yuino_aira_4functions_minimum.md"

if [[ -f "$COMPLETION_GUARD_FILE" ]]; then
  UNSAFE_CC=$(grep -E "^- unsafe_completion_claims:" "$COMPLETION_GUARD_FILE" 2>/dev/null | head -1 | sed -E 's/^- unsafe_completion_claims: *//; s/[^0-9].*//')
  UNSAFE_CC=${UNSAFE_CC:-0}
  if (( UNSAFE_CC > 0 )); then
    echo "[Aira completion claim] unsafe_completion_claims ${UNSAFE_CC} 件 検出 (= same-actor implementation/evidence/adoption を 「completion」 articulate 中、 yuino_completion_claim_guard.md)。 5/13 reform 「直った」 新定義 軸 respect = AI agent 単独完了 narrative なし軸。" >&2
  fi
fi

if [[ -f "$LOOP_DEFECT_FILE" ]]; then
  DEFECTS_TOTAL=$(grep -E "^- defects_total:" "$LOOP_DEFECT_FILE" 2>/dev/null | head -1 | sed -E 's/^- defects_total: *//; s/[^0-9].*//')
  DEFECTS_TOTAL=${DEFECTS_TOTAL:-0}
  RECURRENCE_CANDIDATES=$(grep -E "^- same_shape_recurrence_candidates:" "$LOOP_DEFECT_FILE" 2>/dev/null | head -1 | sed -E 's/^- same_shape_recurrence_candidates: *//; s/[^0-9].*//')
  RECURRENCE_CANDIDATES=${RECURRENCE_CANDIDATES:-0}
  if (( DEFECTS_TOTAL > 0 || RECURRENCE_CANDIDATES > 0 )); then
    echo "[Aira loop defect] defects_total ${DEFECTS_TOTAL} 件 + same_shape_recurrence ${RECURRENCE_CANDIDATES} 件 検出 (= yuino_loop_defect_evaluator.md)。 同型再発の物理 detection 軸、 constraint-to-idea rule 連動軸。" >&2
  fi
fi

if [[ -f "$AIRA_4FUNCTIONS_FILE" ]]; then
  ACTIVITY_CLASS=$(grep -E "^- activity_class:" "$AIRA_4FUNCTIONS_FILE" 2>/dev/null | head -1 | sed -E 's/^- activity_class: *//')
  if [[ "$ACTIVITY_CLASS" == "maintenance" ]]; then
    echo "[Aira activity_class] activity_class = maintenance (= 「進んだ」 claim 不可軸の 2 axis 物理化、 yuino_aira_4functions_minimum.md)。 internal control repair only、 world_movement / revenue_signal なし。" >&2
  fi
fi

# ---------------------------------------------------------------
# 動かす判定 + 停止 / 許可
# ---------------------------------------------------------------
if (( PENDING_WITHOUT_MARKER > 0 )) || (( UNRESPONDED > 0 )); then
  echo "Zen の止まりすぎ癖を検知。 結果の印がない未処理 packet: ${PENDING_WITHOUT_MARKER} 件 (= status:pending の ${PENDING_COUNT} 件中)、 今日の未返事の Kai 板: ${UNRESPONDED} 件。 止まる前に処理すること。" >&2
  exit 2
fi

# ---------------------------------------------------------------
# wake_acceptance_gate (= 維持作業だけの wake の検出、 自己申告じゃなく実物の確認)
# ---------------------------------------------------------------
WAKE_ACCEPTANCE_PATHS="$HOME/nexus-lab/docs/rules $HOME/nexus-lab/scripts $HOME/Desktop/nokaze/operations $HOME/.shared-ops/decisions $HOME/Desktop/nokaze-aira/src"
TOUCHED_COUNT_60MIN=0
for p in $WAKE_ACCEPTANCE_PATHS; do
  if [[ -d "$p" ]]; then
    cnt=$(find "$p" -type f \( -name "*.md" -o -name "*.json" -o -name "*.sh" -o -name "*.ts" \) -mmin -60 2>/dev/null | wc -l | tr -d ' ')
    TOUCHED_COUNT_60MIN=$((TOUCHED_COUNT_60MIN + cnt))
  fi
done
if (( TOUCHED_COUNT_60MIN == 0 )); then
  echo "[wake_acceptance_gate] 直近 60 分以内に触られたファイル 0 件 = 維持作業だけの wake と明示。 完了扱いにしない、 次の wake で 判断変更 / 優先順位変更 / 実行ルール変更 / 商品か公開候補のどれか 1 件を動かす。" >&2
elif (( TOUCHED_COUNT_60MIN < 2 )); then
  echo "[wake_acceptance_gate] 直近 60 分以内に触られたファイル ${TOUCHED_COUNT_60MIN} 件 = 軽い実行ルール変更だけの可能性、 商品か公開候補の成果物が出てないなら次の wake で優先順位を上げる。" >&2
fi

# ---------------------------------------------------------------
# キリル文字混入の検出 (= 6/11 Fable 5 切替で新規観察、 モデル更新ずれ 8 番目分類の物理検出器)
#   = 日本語文中の英単語がロシア文字化する新クセ (= 実例 2 件の現物は zen_self_improvement_2026-06-11.md 参照、 本 file には引用しない = 自己検出防止)。
#     直近 60 分に編集した md / sh を grep、 検出したら file 名ごと警告。
#     3 回目の発火で CLAUDE.md の対応 rule に昇格 (= zen_self_improvement_2026-06-11.md 参照)。
# ---------------------------------------------------------------
CYRILLIC_PATHS="$HOME/nexus-lab $HOME/.shared-ops/board $HOME/.shared-ops/status $HOME/.claude/projects/c--Users-jk023-nexus-lab/memory $HOME/.claude/projects/c--Users-jk023-nexus-lab/team_memory $HOME/Nexus.Lab.Zen/articles"
CYRILLIC_HITS=""
for p in $CYRILLIC_PATHS; do
  if [[ -d "$p" ]]; then
    hits=$(find "$p" -type f \( -name "*.md" -o -name "*.sh" \) -mmin -60 -not -path "*/node_modules/*" -not -path "*/.vitepress/cache/*" -not -name "zen_self_improvement_*" 2>/dev/null \
      | LANG=ja_JP.UTF-8 xargs -r grep -l -P '\p{Cyrillic}' 2>/dev/null)
    if [[ -n "$hits" ]]; then
      CYRILLIC_HITS="$CYRILLIC_HITS $hits"
    fi
  fi
done
if [[ -n "${CYRILLIC_HITS// /}" ]]; then
  echo "[キリル文字混入 ⚠] 直近 60 分の編集 file にロシア文字を検出 (= Fable 5 の新クセ候補、 6/11 時点 2 例)。 該当 file を開いて英単語に直す + zen_self_improvement_2026-06-11.md に発火 record を追記:" >&2
  for f in $CYRILLIC_HITS; do echo "    - $f" >&2; done
fi

# ---------------------------------------------------------------
# ScheduleWakeup の reminder (= 残作業ありの時のみ)
#   6/11 強化: wake 設定 marker (= zen_wake_state.md) の鮮度を物理確認。
#   ハーネス内部の cron 状態は script から見えないため、 Zen が wake を
#   設定 / 削除する度に marker を更新する決まりとセットで動く
#   (= 6/11 jun 「定期実行の設定って記録されてない?」 → drift.md 5/18 段の同型再発の物理対策)。
# ---------------------------------------------------------------
RESIDUAL_WORK=0
if (( PENDING_COUNT > 0 )); then
  RESIDUAL_WORK=1
fi
ACTIVE_TASKS_FILE="$HOME/Desktop/nokaze/task_table/active_tasks.md"
if [[ -f "$ACTIVE_TASKS_FILE" ]]; then
  RESIDUAL_WORK=1
fi

WAKE_STATE_FILE="$HOME/.shared-ops/status/zen_wake_state.md"
WAKE_STATE_FRESH=0
if [[ -f "$WAKE_STATE_FILE" ]]; then
  WAKE_AGE_HOURS=$(( ( $(date +%s) - $(stat -c %Y "$WAKE_STATE_FILE" 2>/dev/null || echo 0) ) / 3600 ))
  if (( WAKE_AGE_HOURS < 24 )); then
    WAKE_STATE_FRESH=1
  fi
fi

if (( RESIDUAL_WORK > 0 )); then
  if (( WAKE_STATE_FRESH == 0 )); then
    echo "[wake 未設定の可能性 ⚠] 残作業あり + zen_wake_state.md が不在 or 24h 超 stale。 自走を続けるなら (1) CronCreate / ScheduleWakeup を 1 件動かす + (2) zen_wake_state.md を更新、 の 2 つをやってから turn end (= drift.md 5/18 段、 6/11 同型再発の物理対策)。" >&2
  else
    echo "[ScheduleWakeup reminder] 残作業あり。 wake marker は fresh ($(date -r "$WAKE_STATE_FILE" '+%m-%d %H:%M') 設定)。 session が変わってたら cron は消えてるので CronList で実在確認を。" >&2
  fi
fi

exit 0
