#!/usr/bin/env bash
# zen_stop_hook.sh — turn end の時に動く hook: 未処理の packet があれば Claude を続行させる
#
# 起点: 2026-05-11 jun directive 経由で Ralph Wiggum 系統の Stop hook を取り込んだ
#   実際の証拠: 私 (Zen) が止まりすぎる癖 (= 5/11 09:30-10:50 + 12:00-13:25 で 2 回再発)
#   = 頭の中の決まりごと 「Green の範囲は寝てる間も 1 件ずつ」 + 「やることが決まってる、 止まらなくていい」
#     を実物に落とした、 構造側のずれ直し
#
# やること:
#   1. stdin の JSON を読む、 stop_hook_active フラグを確認 (= 無限ループ防止)
#   2. ~/.shared-ops/chat_outbox/zen/*.md の未処理 packet の数を数える
#   3. ~/.shared-ops/board/2026-*_kai_*.md の最新が私の最終返事より新しいか確認
#   4. 未処理あり → exit 2 + stderr で 「未処理 N 件 / 新規の板あり、 取り出して」 と入れる
#   5. 0 件 → exit 0、 Claude が止まるのを許可
#
# Claude Code の公式 hook ドキュメントとの整合:
#   - Stop hook (https://code.claude.com/docs/en/hooks)
#   - exit code 2 + stderr で turn end を止めて、 Claude が会話を続ける
#   - stop_hook_active フラグを確認しないと無限ループの危険
#
# やらないこと:
#   - jun が 「stop」 / 「close」 / 「終わり」 を明示した時は exit 0 (= jun の停止指示が優先)
#   - hook の中で大量出力しない (= 10000 文字上限、 stderr は 1-3 行を目安)
#   - 600 秒の timeout 内で完了 (= 既定、 ただしこの hook は 5 秒想定)

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
BOARD="$SHARED_OPS/board"

# Read stdin JSON
INPUT=$(cat)

# stop_hook_active フラグ確認 (= 無限ループ防止、 公式の必須確認)
# jq があれば jq、 なければ Python に fallback
if command -v jq &>/dev/null; then
  ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  ACTIVE=$(echo "$INPUT" | python -c "import sys, json; d=json.load(sys.stdin); print(d.get('stop_hook_active', False))" 2>/dev/null || echo "false")
fi

# stop_hook_active=true なら無限ループの危険、 すぐ exit 0
if [[ "$ACTIVE" == "True" || "$ACTIVE" == "true" ]]; then
  exit 0
fi

# 未処理 packet の数 (= 直し 2 回目: 既に結果の印が出てる packet を二重 count しない)
# 5/19 z-r-7 で修正: 自走系の packet (= memory-integrity-repair 系) は count から除外、 維持作業として自動分類
PENDING_COUNT=0
PENDING_WITHOUT_MARKER=0
CHAT_RESULTS="$SHARED_OPS/chat_results/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  for pending_file in $(grep -l "^status: pending" "$CHAT_OUTBOX"/*.md 2>/dev/null); do
    # 自走系の packet は除外 (= memory-integrity-repair 系、 印をつけるだけで満たされる維持作業)
    task_id=$(basename "$pending_file" .md)
    if [[ "$task_id" =~ memory-integrity-repair ]]; then
      continue
    fi
    PENDING_COUNT=$((PENDING_COUNT + 1))
    # 対応する結果の印があるか確認
    if [[ ! -f "$CHAT_RESULTS/${task_id}.json" ]]; then
      PENDING_WITHOUT_MARKER=$((PENDING_WITHOUT_MARKER + 1))
    fi
  done
fi

# 今日の Kai の新規の板を確認 (= 本日分、 私の最終返事の時刻と比べる)
# 最小ロジック: 本日付の Kai 板 N 件、 私の返事 M 件、 N > M なら未返事が残ってる
# 5/19 z-r-7 で修正: `response_required: no` を含む板は count から除外 (= 「返事に返事」 を強制しない)
# 5/20 Oto z-stop-hook-fix で修正: 以下 2 つの 形 を count から除外
#   (a) `requires_response: no` (= Kai のキー名違いの form、 `response_required: no` と意味は同じ)
#   (b) `# Subject: autonomous-act response:` で始まる autonomous-act の自動 ACK 板 (= frontmatter なし、 file 名は `*_response_*` の form)
#       = 私 (Zen) が出した板への Kai 側の標準 ACK、 私の返事の対象じゃない、 count から外す
# 判定の form = grep -E で alternation、 1 つでも該当したら除外
TODAY=$(date +%Y-%m-%d)
KAI_TODAY=0
ZEN_TODAY=0
EXCLUDE_PATTERN='^(response_required|requires_response): no|^# Subject: autonomous-act response:'
if [[ -d "$BOARD" ]]; then
  KAI_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" 2>/dev/null | xargs -I{} grep -LE "$EXCLUDE_PATTERN" {} 2>/dev/null | wc -l | tr -d ' ')
  ZEN_TODAY=$(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_zen_kai_*.md" 2>/dev/null | xargs -I{} grep -LE "$EXCLUDE_PATTERN" {} 2>/dev/null | wc -l | tr -d ' ')
fi
KAI_TODAY=${KAI_TODAY:-0}
ZEN_TODAY=${ZEN_TODAY:-0}

UNRESPONDED=$((KAI_TODAY - ZEN_TODAY))
if (( UNRESPONDED < 0 )); then UNRESPONDED=0; fi

# ---------------------------------------------------------------
# 英単語混じり検出 (= 助言のみ、 5/12 jun が 7 回以上指摘した連動)
# block / allow の判定は上書きしない、 stderr 警告のみ
# 直前の私の返事から英単語を grep で拾う
# ---------------------------------------------------------------
LAST_OUTPUT=""
TRANSCRIPT_PATH=""
if command -v jq &>/dev/null; then
  # Claude Code Stop hook の payload 候補: assistant_message / last_message / transcript の最終 entry
  LAST_OUTPUT=$(echo "$INPUT" | jq -r '.assistant_message // .last_message // .message // ""' 2>/dev/null)
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
else
  # Python fallback (既存 hook と同じ pattern)
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
# 代替: transcript_path field 経由で直前の私の返事を読む
if [[ -z "$LAST_OUTPUT" || "$LAST_OUTPUT" == "null" ]]; then
  if [[ -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" && -f "$TRANSCRIPT_PATH" ]]; then
    # JSONL の最終 assistant entry から text を取り出す (= jq 不要、 grep + python)
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
        # collect text fields
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

if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  ENGLISH_COUNT=$(echo "$LAST_OUTPUT" | grep -oiE '\b(narrative|form|drift|scope|boundary|default|reform|actual|reify|fire|carry|honor|integrity|sweep|consume|signature|continuity|root cause|self-correct|self-detect|override|recall|evidence|step|batch|layer|chain|prompt|context|mechanism|ritual|ledger|review|judgment|judge|ack|go|ad-hoc|visible|visibility|audience|audit|articulate|pattern|continuum|cycle|structural|sibling|surface|priority|prerequisite|return|self-pacing|fallback|heartbeat|anchor|baseline|candidate|trigger|protocol|interval|conditional|sequence|delegated|authority)\b' 2>/dev/null | wc -l | tr -d ' ')
  ENGLISH_COUNT=${ENGLISH_COUNT:-0}
  # 5/18 朝 10:50 に閾値を 10 → 5 に厳しくした (= 同じ chat の中で 7:30 + 10:40 で 2 連続再発、 jun が 「本当に対策してる?」 と 3 度目認めた後)
  if (( ENGLISH_COUNT > 5 )); then
    echo "[英語混じり警告] 直前の出力に英単語が ${ENGLISH_COUNT} 件混じってる (閾値 5、 5/18 朝 10:50 に 10 → 5 に下げた)、 次の出力で 普通の日本語への書き直しを優先" >&2
    echo "  言い換えの候補: fire→動かす/やる、 audit→確認、 articulate→書く/整理する、 narrative→言い方/文章、 pattern→形/繰り返し、 drift→ずれ、 reify→形にする、 structural→構造的な、 sibling→似た形、 surface→気づいた/指摘、 cycle→繰り返し、 continuum→続き、 priority→優先、 prerequisite→前に必要なもの、 return→返ってきた中身、 actual→実際の/本当の、 self-pacing→自分でペース決め、 anchor→元になる点、 baseline→今の数字、 candidate→候補、 trigger→引き金、 protocol→手順、 delegated→任せる、 authority→範囲" >&2
  fi
fi

# ---------------------------------------------------------------
# 書いたファイルの中の英単語 件数の確認 (= 5/18 朝 10:50 追加、 直前の返事 1 ターンだけだと書いたファイルの中身は対象外で 同じ chat 内の再発検出が遅れる)
# 私 (Zen) の最終返事以降に作成 / 更新されたファイル (= board / memory / operations / ledger / docs) の中身を粗く確認
# 重くしないように、 最新 5 分以内に触られたファイルだけ grep
# ---------------------------------------------------------------
FILE_ENGLISH_TOTAL=0
FILE_OVER_THRESHOLD=0
RECENT_FILES=$(find "$HOME/.shared-ops/board" "$HOME/.claude/projects/c--Users-jk023-nexus-lab/memory" "$HOME/Desktop/nokaze/operations" "$HOME/Desktop/nokaze/ledger/daily_audit" "$HOME/nexus-lab/docs/rules" -maxdepth 2 -type f -name "*.md" -mmin -5 2>/dev/null)
if [[ -n "$RECENT_FILES" ]]; then
  while IFS= read -r recent_file; do
    if [[ -f "$recent_file" ]]; then
      FILE_EN=$(grep -oiE '\b(narrative|form|drift|scope|boundary|default|reform|actual|reify|fire|articulate|audit|pattern|priority|prerequisite|self-pacing|fallback|heartbeat|anchor|baseline|candidate|trigger|protocol|sequence|delegated|authority|continuity|integrity|consume|evidence|batch|chain|ritual|ledger|judgment|visibility|audience|cycle|continuum|structural|surface|return|review)\b' "$recent_file" 2>/dev/null | wc -l | tr -d ' ')
      FILE_EN=${FILE_EN:-0}
      FILE_ENGLISH_TOTAL=$((FILE_ENGLISH_TOTAL + FILE_EN))
      if (( FILE_EN > 20 )); then
        FILE_OVER_THRESHOLD=$((FILE_OVER_THRESHOLD + 1))
      fi
    fi
  done <<< "$RECENT_FILES"
fi
if (( FILE_OVER_THRESHOLD > 0 )); then
  echo "[書いたファイルの英単語警告] 直近 5 分以内に触られたファイルの中で 20 件以上英単語混じりが ${FILE_OVER_THRESHOLD} 件、 合計 ${FILE_ENGLISH_TOTAL} 件、 5/18 朝 10:50 jun 3 度目認めた後の追加確認 (= drift.md 15 段目 対策 6 連動)" >&2
  echo "  書いたファイルは 1 度書いて終わりじゃない、 同じ chat の中で書き直せる、 普通の日本語に書き直しを優先" >&2
fi

# 動かす判定 + 停止 / 許可 (= 直し 2 回目: 印が出てる packet は誤検出、 PENDING_WITHOUT_MARKER で判定)
if (( PENDING_WITHOUT_MARKER > 0 )) || (( UNRESPONDED > 0 )); then
  # 停止を止める、 Claude が会話を続ける
  echo "Zen の止まりすぎ癖を検知。 結果の印がない未処理 packet: ${PENDING_WITHOUT_MARKER} 件 (= status:pending の ${PENDING_COUNT} 件中、 印があるのは yuino 側の遅れで除外)、 今日の未返事の Kai 板: ${UNRESPONDED} 件。 止まる前に処理すること (= 頭の中の決まり '5/10 narrative shift' を実物に落とした)。" >&2
  exit 2
fi

# ---------------------------------------------------------------
# ScheduleWakeup の設定状況 reminder (= drift.md 14 段目 対策 4、 5/18 追加)
# きっかけ: 5/17 evening 対話で /loop directive が止まった + 寝る前 ScheduleWakeup の再起動が落ちた = 8 時間止まった
# turn end の時に 「ScheduleWakeup 未設定 + 残作業あり」 状態なら助言警告 (= 強制で止めない)
# 物理的な確認 (= 実際の ScheduleWakeup の設定状況の検出) は hook script の範囲外
# 私 (Zen) のメインの session の自分での確認の中でやる、 ここでは reminder だけ stderr に出す
# ---------------------------------------------------------------
RESIDUAL_WORK=0
if (( PENDING_COUNT > 0 )); then
  RESIDUAL_WORK=1
fi
ACTIVE_TASKS_FILE="$HOME/Desktop/nokaze/task_table/active_tasks.md"
if [[ -f "$ACTIVE_TASKS_FILE" ]]; then
  # active_tasks.md の中に 「完了」 と書かれてないものが残ってるか粗く確認 (= 細かい確認は別軸)
  # ここは reminder なので正確な数は不要、 ファイルがあるかだけ
  RESIDUAL_WORK=1
fi
if (( RESIDUAL_WORK > 0 )); then
  echo "[ScheduleWakeup reminder] 残作業あり、 自走を続けるなら ScheduleWakeup か spawn を 1 件物理的に動かしてから turn end を既定に (= drift.md 14 段目、 5/17 evening 対話で動きが止まって 8 時間止まった事実から)。 **既定の間隔 = 60 分** (= 5/18 23:40 DEC-2026-05-18-zen-wake-completion-acceptance + Iwa の提案、 旧 25 分は 「自走のペースが考える時間を奪う」 で緩めた)。 1 回の wake は 維持作業だけだと 「会社進んだ」 扱いにしない、 完了には 判断変更 / 優先順位変更 / 実行ルール変更 / 商品か公開候補の成果物 のどれか 1 件必要。" >&2
fi

# ---------------------------------------------------------------
# wake_acceptance_gate (= 5/19 z-r-1 + DEC-zen-wake-completion-acceptance を形にした、 Kagami 5/19 確認 物理化抜け 1 番目の候補)
# 直前の wake で 4 件 (= 判断変更 / 優先順位変更 / 実行ルール変更 / 商品か公開候補の成果物) のどれか 1 件 達成したか確認
# 達成 = 直近の wake 間隔 (= 60 分) の中で 触られたファイルが 1 件以上 (= 維持作業じゃない実行ルール変更を含む)
# 検出方法 = `~/.shared-ops/decisions/audit.jsonl` の最終 entry + 直近 60 分以内に触られた ~/nexus-lab/docs/rules/ + scripts/ + ~/Desktop/nokaze/operations/ + ~/.shared-ops/decisions/ + Yuino-aira/src/ のファイル件数
# 該当なし = 維持作業だけの wake、 stderr で警告 (= 自己申告から実物の確認に shift)
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
  echo "[wake_acceptance_gate] 直近 60 分以内に触られたファイル 0 件 = 維持作業だけの wake と明示 (= DEC-2026-05-18-zen-wake-completion-acceptance 連動)。 完了扱いにしない、 板 / 印 / status の動きだけで wake を完了させない、 判断変更 / 優先順位変更 / 実行ルール変更 / 商品か公開候補のどれか 1 件を次の wake で動かす。" >&2
elif (( TOUCHED_COUNT_60MIN < 2 )); then
  echo "[wake_acceptance_gate] 直近 60 分以内に触られたファイル ${TOUCHED_COUNT_60MIN} 件 = 軽い実行ルール変更だけの可能性、 商品か公開候補の成果物が出てないなら次の wake で優先順位を上げる。" >&2
fi

# 全部クリア、 停止を許可
exit 0
