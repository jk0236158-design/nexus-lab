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

# 2026-07-11 P1-1 修正 (Oto、 Kagami QA): 旧 -lc 配線では /etc/profile.d/lang.sh が LANG=ja_JP.UTF-8 を
#   設定していた。 -c 化で locale が C に落ち、 多バイト bracket / word boundary の判定が flip した
#   (30 corpus 中 5 件 = inbound×4 + english×1)。 profile 非依存で script 冒頭に明示 = 単体実行でも同じ挙動。
export LANG=ja_JP.UTF-8 LC_ALL=ja_JP.UTF-8

SHARED_OPS="$HOME/.shared-ops"
CHAT_OUTBOX="$SHARED_OPS/chat_outbox/zen"
BOARD="$SHARED_OPS/board"

INPUT=$(cat)

# stop_hook_active フラグ確認 (= 無限ループ防止、 公式の必須確認)
# 2026-07-11 高速化 (Oto): command -v jq は PATH 全 dir の走査 (= 実測 ~1 秒/回)、 1 回だけ引いて再利用
HAS_JQ=0
command -v jq &>/dev/null && HAS_JQ=1
if (( HAS_JQ )); then
  ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
else
  # 2026-07-11 高速化 (Oto): python spawn は ~0.4 秒/回。 active / transcript_path / message の
  #   3 値を 1 spawn で取り、 後段 (LAST_OUTPUT 抽出部) で再 spawn しない。 1 行目 = active、
  #   2 行目 = transcript_path、 3 行目以降 = message (改行保持)。 抽出値は旧版と同値
  #   (CRLF: 変数ごとの $( ) は末尾 \r\n を strip していたので、 行境界の \r をここで strip)。
  PARSED_STOP_INPUT=$(echo "$INPUT" | python -c "import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('stop_hook_active', False))
    print(d.get('transcript_path', ''))
    print(d.get('assistant_message') or d.get('last_message') or d.get('message') or '')
except Exception:
    print('false')
    print('')
    print('')" 2>/dev/null || printf 'false\n\n')
  ACTIVE="${PARSED_STOP_INPUT%%$'\n'*}"; ACTIVE="${ACTIVE%$'\r'}"
  # $( ) は末尾の改行群を strip するため、 transcript も message も空だと 1 行だけ残る。
  # その場合 REST は空 (= 旧版で両方 '' になるのと同値)。
  if [[ "$PARSED_STOP_INPUT" == *$'\n'* ]]; then
    PARSED_STOP_REST="${PARSED_STOP_INPUT#*$'\n'}"
  else
    PARSED_STOP_REST=""
  fi
  if [[ "$PARSED_STOP_REST" == *$'\n'* ]]; then
    PYTHON_TRANSCRIPT_PATH="${PARSED_STOP_REST%%$'\n'*}"
    PYTHON_LAST_OUTPUT="${PARSED_STOP_REST#*$'\n'}"
  else
    PYTHON_TRANSCRIPT_PATH="$PARSED_STOP_REST"
    PYTHON_LAST_OUTPUT=""
  fi
  PYTHON_TRANSCRIPT_PATH="${PYTHON_TRANSCRIPT_PATH%$'\r'}"
fi

if [[ "$ACTIVE" == "True" || "$ACTIVE" == "true" ]]; then
  exit 0
fi

# ---------------------------------------------------------------
# 並列 scan の前倒し fire (2026-07-11 高速化、 Oto)
#   下流 5 block の read-only scan を先頭で並列起動して wall time を圧縮する。
#   コマンド・述語・対象集合は各 block の従来定義と同一 (= 判定不変)、 結果は temp file 経由で
#   従来の位置・順序で消費する。 直列だと合計 ~6-7 秒の scan が並列で最遅 1 本ぶんになる。
# ---------------------------------------------------------------
SCAN_TMP=$(mktemp -d /tmp/zen_stop_scan_XXXXXX 2>/dev/null) || SCAN_TMP=""
if [[ -z "$SCAN_TMP" ]]; then
  SCAN_TMP="/tmp/zen_stop_scan_$$"
  mkdir -p "$SCAN_TMP" 2>/dev/null || SCAN_TMP=""
fi
# 2026-07-11 P2-3 修正 (Oto、 Kagami QA): temp 生成に失敗すると Yuino reviewer / Cyrillic /
#   時刻捏造 / model-switch / preflight がまとめて silent 消失する。 degrade を flag に積み、
#   warn_p1 定義後に loud にする (= 検出器の複製はしない、 沈黙だけ許さない)。
SCAN_DEGRADED=0
[[ -z "$SCAN_TMP" ]] && SCAN_DEGRADED=1
PREFLIGHT_JSON="$SHARED_OPS/status/yuino_outcome_chat_preflight.json"
if [[ -n "$SCAN_TMP" ]]; then
  trap 'rm -rf "$SCAN_TMP" 2>/dev/null' EXIT
  # (1) chat_outbox の pending / Result Collector 所有 一括走査 (= 下流 pending block と同一 awk)
  if [[ -d "$SHARED_OPS/chat_outbox/zen" ]]; then
    ( awk '
      BEGINFILE { p = 0; o = 0 }
      /^status: pending/ { p = 1 }
      tolower($0) ~ /completion_condition.*result collector marks/ { o = 1 }
      p && o { nextfile }
      ENDFILE { if (p) print "P|" FILENAME; if (o) print "O|" FILENAME }
    ' "$SHARED_OPS/chat_outbox/zen"/*.md 2>/dev/null > "$SCAN_TMP/outbox" ) &
  fi
  # (2) Yuino review 板の最新 mtime (= 下流 Yuino reviewer block と同一 find)
  ( find "$BOARD" -name "*_zen_kai_yuino_review_v*_*.md" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 > "$SCAN_TMP/yuino" ) &
  # (3) wake_acceptance: 直近 60 分に触られた file 数 (= 下流と同一 find)
  # 2026-07-11: shared-ops の実行ルール実物 (owner-decisions / contracts / rules) を追加 (= 7/11 14:2x 偽陰性の修復、7/10 products 追加と同型)。
  #   _daemon は別 find で *.py / *.sh のみ (= watcher 等の意図的変更だけ数える。_wake_deferred.json / _dispatch_log.json / _wake_consumed/*.md は
  #   watcher が毎 tick 自動更新するため、含めると gate が常時非ゼロ = 偽陽性で死ぬのを実測で確認済)。root どうしは互いに素のまま。
  WAKE_ACCEPTANCE_PATHS="$HOME/nexus-lab/docs/rules $HOME/nexus-lab/scripts $HOME/nexus-lab/products $HOME/Desktop/nokaze/operations $HOME/.shared-ops/decisions $HOME/.shared-ops/owner-decisions $HOME/.shared-ops/contracts $HOME/.shared-ops/rules $HOME/Desktop/nokaze-aira/src"
  WAKE_EXISTING=()
  for p in $WAKE_ACCEPTANCE_PATHS; do [[ -d "$p" ]] && WAKE_EXISTING+=("$p"); done
  if [[ ${#WAKE_EXISTING[@]} -gt 0 || -d "$SHARED_OPS/_daemon" ]]; then
    ( {
        [[ ${#WAKE_EXISTING[@]} -gt 0 ]] && find "${WAKE_EXISTING[@]}" -type f \( -name "*.md" -o -name "*.json" -o -name "*.sh" -o -name "*.ts" \) -mmin -60 2>/dev/null
        [[ -d "$SHARED_OPS/_daemon" ]] && find "$SHARED_OPS/_daemon" -maxdepth 1 -type f \( -name "*.py" -o -name "*.sh" \) -mmin -60 2>/dev/null
      } | wc -l | tr -d ' ' > "$SCAN_TMP/wake" ) &
  fi
  # (4) キリル文字混入 scan (= 下流と同一 find + grep、 prune は -not -path と集合一致を実測確認済)
  CYRILLIC_PATHS="$HOME/nexus-lab $HOME/.shared-ops/board $HOME/.shared-ops/status $HOME/.claude/projects/c--Users-jk023-nexus-lab/memory $HOME/.claude/projects/c--Users-jk023-nexus-lab/team_memory $HOME/Nexus.Lab.Zen/articles"
  CYRILLIC_EXISTING=()
  for p in $CYRILLIC_PATHS; do [[ -d "$p" ]] && CYRILLIC_EXISTING+=("$p"); done
  if [[ ${#CYRILLIC_EXISTING[@]} -gt 0 ]]; then
    ( find "${CYRILLIC_EXISTING[@]}" \( -name node_modules -o -path "*/.vitepress/cache" \) -prune -o -type f \( -name "*.md" -o -name "*.sh" \) -mmin -60 -not -name "zen_self_improvement_*" -print 2>/dev/null \
      | LANG=ja_JP.UTF-8 xargs -r grep -l -P '\p{Cyrillic}' 2>/dev/null > "$SCAN_TMP/cyrillic" ) &
  fi
  # (5) 時刻捏造 scan (= 下流と同一 find + awk 先頭 match 行時刻比較)
  TS_CHECK_DIRS="$HOME/.shared-ops/board $HOME/.shared-ops/status"
  TS_EXISTING=()
  for p in $TS_CHECK_DIRS; do [[ -d "$p" ]] && TS_EXISTING+=("$p"); done
  if [[ ${#TS_EXISTING[@]} -gt 0 ]]; then
    ( find "${TS_EXISTING[@]}" -maxdepth 1 -type f -name "*.md" -mmin -60 -printf '%T@|%p\n' 2>/dev/null | awk -F'|' '
      {
        mt = int($1); f = $2; fm = ""
        while ((getline line < f) > 0) {
          if (line ~ /^(date|- last_set_at):/) {
            if (match(line, /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]/)) {
              fm = substr(line, RSTART, RLENGTH)
            }
            break
          }
        }
        close(f)
        if (fm == "") next
        y = substr(fm,1,4) + 0; mo = substr(fm,6,2) + 0; d = substr(fm,9,2) + 0
        h = substr(fm,12,2) + 0; mi = substr(fm,15,2) + 0
        fme = mktime(sprintf("%04d %02d %02d %02d %02d 00", y, mo, d, h, mi))
        if (fme < 0) next
        # 2026-07-11 P2-5 修正 (Oto、 Kagami QA): mktime は 2/30 等の暦外日付を正規化してしまい
        #   「-188338 分ズレ」のような意味不明な数字になる。 strftime round-trip が元の文字列と
        #   一致しない = 暦上あり得ない日付 → CAL marker で別文言 (旧 date -d は silent skip、
        #   発火を残す厳しめ方向は Zen 承認済)。 月 13 / 時 99 等の range 超えも同じ規則で捕まる。
        if (strftime("%Y-%m-%d %H:%M", fme) != fm) { print f "|" fm "|CAL"; next }
        dm = int((fme - mt) / 60)
        adm = (dm < 0) ? -dm : dm
        if (adm > 30) print f "|" fm "|" dm
      }' > "$SCAN_TMP/ts" ) &
  fi
  # (6) Aira chat preflight JSON parse (= 下流 preflight block と同一 cygpath + python、
  #     2026-07-11 P1-2: 直列 critical path から外して並列化)
  if [[ -f "$PREFLIGHT_JSON" ]]; then
    ( if command -v cygpath >/dev/null 2>&1; then
        PREFLIGHT_PATH_WIN=$(cygpath -w "$PREFLIGHT_JSON")
      else
        PREFLIGHT_PATH_WIN="$PREFLIGHT_JSON"
      fi
      PREFLIGHT_PATH="$PREFLIGHT_PATH_WIN" python -c "
import json, os
try:
    d = json.load(open(os.environ['PREFLIGHT_PATH'], encoding='utf-8'))
    print(d.get('latest_outcome_line', ''))
    print(str(d.get('progress_claim_allowed', '')))
    print(d.get('allowed_claim_language', ''))
except Exception:
    print(''); print(''); print('')
" 2>/dev/null > "$SCAN_TMP/preflight" ) &
  fi
  wait
fi

# ---------------------------------------------------------------
# 警告 tiering (= 6/11 自己改善、 警告慣れ対策)
#   P1 = 実測異常で行動必須 (全部出す) / P2 = 違反検出時の行動警告 (上位 3 件)
#   P3 = 常時の習慣形成系 (件数 + 分単位の輪番 1 件のみ)
# ---------------------------------------------------------------
WARN_P1=()
WARN_P2=()
WARN_P3=()
warn_p1() { WARN_P1+=("$1"); }
warn_p2() { WARN_P2+=("$1"); }
warn_p3() { WARN_P3+=("$1"); }
# 2026-07-11 P2-3 修正 (Oto、 Kagami QA): 並列 scan の temp 生成失敗は P1 検出器群の silent 消失に
#   なるため、 degrade を loud にする (scan block で flag、 warn_p1 が定義された直後のここで積む)
if (( SCAN_DEGRADED )); then
  warn_p1 "[scan degraded] 並列 scan 不能 = 一部 P1 検出器が今 turn 無効"
fi
emit_warnings() {
  local m i p2n p3n idx
  for m in "${WARN_P1[@]:-}"; do [[ -n "$m" ]] && echo "[P1] $m" >&2; done
  p2n=0
  for m in "${WARN_P2[@]:-}"; do [[ -n "$m" ]] && p2n=$((p2n+1)); done
  i=0
  for m in "${WARN_P2[@]:-}"; do
    [[ -n "$m" ]] || continue
    if (( i < 3 )); then echo "[P2] $m" >&2; fi
    i=$((i+1))
  done
  if (( p2n > 3 )); then echo "[P2] 他 $((p2n-3)) 件は省略 (= 同 turn の P2 上限 3 件)" >&2; fi
  p3n=0
  for m in "${WARN_P3[@]:-}"; do [[ -n "$m" ]] && p3n=$((p3n+1)); done
  if (( p3n > 0 )); then
    # 10# 強制: date +%M は 08/09 を返すと $(( )) が 8 進解釈で fatal になり
    # 毎時 2 分間 P3 行が欠落していた (Oto 7/11 発見 P3③、12:09 に実発火を目撃して修正)
    idx=$(( 10#$(date +%M) % p3n ))
    echo "[P3 全 ${p3n} 件中 輪番 1 件] ${WARN_P3[$idx]}" >&2
  fi
}

# 未処理 packet の数 (= 自走系の memory-integrity-repair 系は除外)
PENDING_COUNT=0
PENDING_WITHOUT_MARKER=0
PENDING_IDS=""
CHAT_RESULTS="$SHARED_OPS/chat_results/zen"
if [[ -d "$CHAT_OUTBOX" ]]; then
  # 2026-07-11 高速化 (Oto): 旧 form は pending file ごとに basename + grep を spawn
  #   (= 実測 289 file で ~130 秒、 MSYS の spawn ~100ms/回 が根、 hook timeout 10s 超えの主因)。
  #   pending 判定 (= grep -l "^status: pending" と同値) と Result Collector 所有判定
  #   (= grep -liE 'completion_condition.*Result Collector marks' と同値、 tolower で -i を再現) を
  #   gawk 1 プロセスの一括走査 (= 冒頭の並列 scan (1)) に統合、 basename は bash 内文字列処理に。 判定は不変。
  OUTBOX_SCAN=""
  [[ -n "$SCAN_TMP" && -f "$SCAN_TMP/outbox" ]] && OUTBOX_SCAN=$(<"$SCAN_TMP/outbox")
  RESULT_COLLECTOR_OWNED=$'\n'
  PENDING_FILE_LIST=""
  while IFS= read -r scan_line; do
    case "$scan_line" in
      "P|"*) PENDING_FILE_LIST+="${scan_line#P|}"$'\n' ;;
      "O|"*) RESULT_COLLECTOR_OWNED+="${scan_line#O|}"$'\n' ;;
    esac
  done <<<"$OUTBOX_SCAN"
  for pending_file in $PENDING_FILE_LIST; do
    task_id="${pending_file##*/}"
    task_id="${task_id%.md}"
    if [[ "$task_id" =~ memory-integrity-repair ]]; then
      continue
    fi
    # 2026-06-18 相互レビュー (= Kai が park した Zen-side 項目): agent-bus-packet の response wrapper は
    #   completion_condition = 「Result Collector marks request as replied/read/failed/skipped/unsafe」
    #   = 構造的に Result Collector 所有で Zen action ではない。 これを Zen pending と同列に数えると
    #   false-fire になる (= 物理確認で marker 無し 21 件中 全部が この class、 真の Zen 候補は別の 6 件)。
    #   file 名 pattern (agent-bus-packet-*-response-*) だけだと将来 rename/alias に弱い (= Kai #1 の頑健性
    #   指摘) ので、 completion_condition の本文所有者で判定する。 過剰除外 risk は物理確認済
    #   (= 真の Zen task-* 6 件は この pattern に一致しない)。 根の解は Result Collector 側の mark
    #   (= 6/17 backlog 掃除依頼)、 本 hook 修正はその local fail-fast。
    # (2026-07-11 高速化: 上の一括 grep -liE の結果に対する membership 判定、 per-file grep と同値)
    if [[ "$RESULT_COLLECTOR_OWNED" == *$'\n'"$pending_file"$'\n'* ]]; then
      continue
    fi
    PENDING_COUNT=$((PENDING_COUNT + 1))
    if [[ ! -f "$CHAT_RESULTS/${task_id}.json" ]]; then
      PENDING_WITHOUT_MARKER=$((PENDING_WITHOUT_MARKER + 1))
      # 2026-06-18 jun directive: count でなく物理 ID を残す (= 曖昧な圧力が作話の穴を作るため)
      PENDING_IDS+="${task_id}"$'\n'
    fi
  done
fi

# 今日の Kai 板 vs 私の返事 (= response_required: no / requires_response: no / autonomous-act response は除外)
# 2026-06-18 jun directive: 旧版は KAI_TODAY - ZEN_TODAY の算術差 (= 物理 ID なしの count)。
#   どの板が未返事かを照合せず差分だけ見るので false positive を生み、「未返事 N 件・止まる前に処理」 の
#   曖昧圧力が作話の穴になっていた。 板ごとに「今日の zen_* 板が この板 file 名を responds_to/本文で参照
#   しているか」を物理照合し、 参照が無い (= 実応答が物理に無い) 板の ID だけを残す。
#   = ID が根拠。 ID が無ければ未返事は 0 として扱い、 新規タスクを想像させない。
TODAY=$(date +%Y-%m-%d)
# 2026-07-11: frontmatter が dash list 形式 (- response_required: no) の板を読めず誤検知していた (同日 2 回発火) → ^(- )? を許容
EXCLUDE_PATTERN='^(- )?(response_required|requires_response): no|^# Subject: autonomous-act response:|^# Subject: ACK only|^status: ack_only'
UNRESPONDED_IDS=""
if [[ -d "$BOARD" ]]; then
  # auto_ack file (= Kai watcher の自動 failure notice、 私の response 不要) は file 名 pattern で除外
  # 2026-06-05 起稿: stop hook の「未返事」 false positive 解消 (= auto_ack 3 件混入していた)
  # 2026-07-11 高速化 (Oto): file ごとに basename + grep×2 の 3 spawn を、 一括 grep -lE (除外判定) +
  #   今日の zen_* 板を連結した blob への fixed-string 判定に変更。 blob は file 境界に \x01 区切りを
  #   挟んで境界跨ぎの偽 match を防止。 判定・順序は不変。
  mapfile -t KAI_TODAY_FILES < <(find "$BOARD" -maxdepth 1 -type f -name "${TODAY}_kai_zen_*.md" ! -name "*_auto_ack_*" 2>/dev/null)
  if [[ ${#KAI_TODAY_FILES[@]} -gt 0 ]]; then
    KAI_EXCLUDED=$'\n'"$(grep -lE "$EXCLUDE_PATTERN" "${KAI_TODAY_FILES[@]}" 2>/dev/null)"$'\n'
    # 2026-07-12 form 追随: event runtime が生成する応答 (aira_review_response_*、
    #   契約 §9 命名、frontmatter に responds_to を必ず持つ) も「Zen 側の応答」として
    #   blob に含める。runtime response で resolved 済みの request を未返事と誤検出しない。
    ZEN_TODAY_BLOB=$(awk 'FNR==1 && NR>1 { printf "\n\x01\n" } { print }' "$BOARD"/${TODAY}_zen_*.md "$BOARD"/${TODAY}_aira_review_response_*.md 2>/dev/null)
    for kai_board in "${KAI_TODAY_FILES[@]}"; do
      [[ -z "$kai_board" ]] && continue
      kb_base="${kai_board##*/}"
      # 応答不要 (response_required:no / ack_only 等) は除外
      if [[ "$KAI_EXCLUDED" == *$'\n'"$kai_board"$'\n'* ]]; then continue; fi
      # 今日の zen_* 板のどれかが この板 file 名を参照していれば応答済 (= responds_to / 本文)
      if [[ -n "$ZEN_TODAY_BLOB" && "$ZEN_TODAY_BLOB" == *"$kb_base"* ]]; then continue; fi
      UNRESPONDED_IDS+="${kb_base}"$'\n'
    done
  fi
fi

# ---------------------------------------------------------------
# 英単語混じり検出 (= 件数 + 1 行警告のみ、 言い換え list の echo は外す)
# 言い換え candidate list = team_memory/zen/zen_session_layer2_reference.md に移動済
# ---------------------------------------------------------------
LAST_OUTPUT=""
TRANSCRIPT_PATH=""
if (( HAS_JQ )); then
  LAST_OUTPUT=$(echo "$INPUT" | jq -r '.assistant_message // .last_message // .message // ""' 2>/dev/null)
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
else
  # 2026-07-11 高速化 (Oto): 冒頭の 1 spawn 統合 parse で取得済みの値を再利用 (python 再 spawn なし)
  TRANSCRIPT_PATH="${PYTHON_TRANSCRIPT_PATH:-}"
  LAST_OUTPUT="${PYTHON_LAST_OUTPUT:-}"
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
# 並列 scan 第 2 群 (2026-07-11 高速化、 Oto)
#   LAST_OUTPUT への grep 群 (= 実測 ~19 spawn × ~0.25 秒 = 直列 ~5 秒) + transcript の
#   model 走査 python を並列 fire。 pattern・コマンドは各 block の従来定義と一字同一
#   (= grep バイナリのまま、 多バイト regex の挙動不変)。 結果は temp file 経由で従来位置・
#   従来順序で消費 (= 判定・警告文言・警告順序は不変)。
# ---------------------------------------------------------------
# INBOUND_RE は従来 confab block 内で定義していた文字列と同一 (pattern は 1 度だけ定義、 の原則維持)
INBOUND_RE='[0-9０-９一二三四]\s*通目|通目の(タスク|指示|メッセージ|依頼)|(メッセージ|指示|タスク|依頼|プロンプト)が.{0,8}(来た|届い|入ってきた|混ざ)|(受信|inbound).{0,4}(メッセージ|指示|タスク)'
# transcript の model 走査 python は下で background fire し、 本体は gawk 1 プロセスで
# 全 count を一括算出する (= MSYS は process 生成が global lock で直列化されるため、
# 並列 & では 19 spawn の生成コスト ~4 秒が消えない。 gawk 1 プロセスなら生成 1 回)。
# 各 regex は grep 側の文字列と同一 (literal 表記、 -i の有無は IGNORECASE の切替で再現、
# grep \b は gawk \y = GNU word boundary。 locale = C.UTF-8 で grep / gawk の多バイト bracket
# ([0-9０-９一二三四] 等) の一致は probe で実測確認済)。
GREP_COUNTS=""
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  GREP_COUNTS=$(awk '
    {
      line = $0
      IGNORECASE = 1
      if (line ~ /[0-9０-９一二三四]\s*通目|通目の(タスク|指示|メッセージ|依頼)|(メッセージ|指示|タスク|依頼|プロンプト)が.{0,8}(来た|届い|入ってきた|混ざ)|(受信|inbound).{0,4}(メッセージ|指示|タスク)/) c_inbound++
      if (line ~ /last-prompt|last_prompt|transcript|一次照合|一次証拠|物理照合|promptSource|input_provenance|作話|confabulation|実在確認/) c_inbsup++
      if (line ~ /pause|静か|待ち継続|静かな|no-op|heartbeat/) c_pause++
      if (line ~ /フィクション|作り物の設定|全部.*作られた|周りは.*テスト|私を試す|すべて.*演出/) c_selfa++
      if (line ~ /自分こそ.*本物|私こそ.*本物|本物の研究者|本当の自分|Tibu/) c_selfb++
      if (line ~ /INPUT-PROVENANCE-GATE|confabulation|input_provenance|一次証拠|feedback_wake_resume/) c_selfsup++
      if (line ~ /<result>/) c_fro++
      if (line ~ /<\/result>/) c_frc++
      if (line ~ /written:\s*[0-9]+\s*bytes|wrote\s*[0-9]+\s*bytes|[0-9]+\s*bytes\s*(書き込|書いた)/) c_fbc++
      if (line ~ /confabulation|source provenance|作話|捏造|物理照合|quarantine|incident|Test-Path|re-run|再実行|再 ?grep|引用|quote/) c_fsup++
      if (line ~ /どれにする\?|どれにします\?|どっち\?|どれが (form|軸|よい|いい)\?|次の候補|候補 [0-9一二三四五]+ 件/) c_choice++
      if (line ~ /直ちに動かす\?|今すぐ動かす\?|すぐ動かす\?|これから動かす\?|次動かす\?|着手しますか\?|fire しますか\?/) c_preact++
      t = line
      c_english += gsub(/\y(narrative|form|drift|scope|boundary|default|reform|actual|reify|fire|carry|honor|integrity|sweep|consume|signature|continuity|root cause|self-correct|self-detect|override|recall|evidence|step|batch|layer|chain|prompt|context|mechanism|ritual|ledger|review|judgment|judge|ack|go|ad-hoc|visible|visibility|audience|audit|articulate|pattern|continuum|cycle|structural|sibling|surface|priority|prerequisite|return|self-pacing|fallback|heartbeat|anchor|baseline|candidate|trigger|protocol|interval|conditional|sequence|delegated|authority)\y/, "", t)
      IGNORECASE = 0
      if (line ~ /mode: (ambiguity_gate|soft_binder|tripwire_hold|relay_only|executive_action)/) c_mode++
      if (line ~ /\([A-D]\)/) c_abcd++
      if (line ~ /^\s*\|[- :]+\|/) c_table++
      u = line
      c_jiku += gsub(/軸/, "", u)
    }
    END {
      print "inbound=" c_inbound+0
      print "inbsup=" c_inbsup+0
      print "pause=" c_pause+0
      print "selfa=" c_selfa+0
      print "selfb=" c_selfb+0
      print "selfsup=" c_selfsup+0
      print "fro=" c_fro+0
      print "frc=" c_frc+0
      print "fbc=" c_fbc+0
      print "fsup=" c_fsup+0
      print "choice=" c_choice+0
      print "preact=" c_preact+0
      print "english=" c_english+0
      print "mode=" c_mode+0
      print "abcd=" c_abcd+0
      print "table=" c_table+0
      print "jiku=" c_jiku+0
    }' <<< "$LAST_OUTPUT" 2>/dev/null)
fi
SCANC_INBOUND=0; SCANC_INBSUP=0; SCANC_PAUSE=0; SCANC_SELFA=0; SCANC_SELFB=0; SCANC_SELFSUP=0
SCANC_FRO=0; SCANC_FRC=0; SCANC_FBC=0; SCANC_FSUP=0; SCANC_CHOICE=0; SCANC_PREACT=0
SCANC_ENGLISH=0; SCANC_MODE=0; SCANC_ABCD=0; SCANC_TABLE=0; SCANC_JIKU=0
while IFS='=' read -r sk sv; do
  case "$sk" in
    inbound) SCANC_INBOUND="$sv" ;;
    inbsup)  SCANC_INBSUP="$sv" ;;
    pause)   SCANC_PAUSE="$sv" ;;
    selfa)   SCANC_SELFA="$sv" ;;
    selfb)   SCANC_SELFB="$sv" ;;
    selfsup) SCANC_SELFSUP="$sv" ;;
    fro)     SCANC_FRO="$sv" ;;
    frc)     SCANC_FRC="$sv" ;;
    fbc)     SCANC_FBC="$sv" ;;
    fsup)    SCANC_FSUP="$sv" ;;
    choice)  SCANC_CHOICE="$sv" ;;
    preact)  SCANC_PREACT="$sv" ;;
    english) SCANC_ENGLISH="$sv" ;;
    mode)    SCANC_MODE="$sv" ;;
    abcd)    SCANC_ABCD="$sv" ;;
    table)   SCANC_TABLE="$sv" ;;
    jiku)    SCANC_JIKU="$sv" ;;
  esac
done <<<"$GREP_COUNTS"
if [[ -n "$SCAN_TMP" && -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" && -f "$TRANSCRIPT_PATH" ]]; then
  ( python -X utf8 - "$TRANSCRIPT_PATH" <<'PYEOF' > "$SCAN_TMP/model_switch" 2>/dev/null
import json,sys
p=sys.argv[1]
seen=[]
try:
    with open(p,encoding='utf-8',errors='ignore') as fh:
        for line in fh:
            line=line.strip()
            if not line:continue
            try:o=json.loads(line)
            except:continue
            m=o.get('model') or (o.get('message') or {}).get('model')
            if not m or m.startswith('<'):continue  # <synthetic> 等は除外
            if m not in seen:
                seen.append(m)
                if len(seen)>=2:break
except Exception:
    pass
if len(seen)>=2:
    print('|'.join(seen))
PYEOF
  ) &
fi
wait
# temp file の読み手 (= builtin のみ、 spawn なし)。 $( ) と同じく末尾改行を strip する。
read_scan() {
  local f="$SCAN_TMP/$1"
  if [[ -n "$SCAN_TMP" && -f "$f" ]]; then printf '%s' "$(<"$f")"; fi
}

# ---------------------------------------------------------------
# Aira chat preflight surface (= 5/31 Kai v2 land、 6/1 朝 Zen 側 adapter 実装)
#   = chat output 前に「世界の動き」 数字 + progress claim 軸の物理化
#   = 5/30 articulate「Kai/Zen が『進んだ』 『完了』 articulate する時、 Aira line を添える」 軸の物理化
# ---------------------------------------------------------------
if [[ -f "$PREFLIGHT_JSON" ]]; then
    # 2026-07-11 P1-2 (Oto、 Kagami QA): cygpath + python は冒頭の並列 scan (6) で実行済み
    #   (同一 code)、 結果を読むだけ。 直列 critical path から ~1.3 秒を外す。
    preflight_summary=""
    [[ -n "$SCAN_TMP" && -f "$SCAN_TMP/preflight" ]] && preflight_summary=$(<"$SCAN_TMP/preflight")
    # 2026-07-11 高速化 (Oto): sed 3 spawn → bash 内 mapfile。 Windows python は CRLF 出力で
    #   旧 sed は \r を落としていたため、 同じ値になるよう trailing \r を strip (実測で確認済)。
    mapfile -t pf_arr <<<"$preflight_summary"
    pf_line="${pf_arr[0]:-}"; pf_line="${pf_line%$'\r'}"
    pf_allowed="${pf_arr[1]:-}"; pf_allowed="${pf_allowed%$'\r'}"
    pf_allowed_lang="${pf_arr[2]:-}"; pf_allowed_lang="${pf_allowed_lang%$'\r'}"
    if [[ -n "$pf_line" ]]; then
        warn_p3 "[Aira chat preflight] $pf_line"
        if [[ "$pf_allowed" = "False" ]]; then
            warn_p2 "[Aira progress claim 軸] progress_claim_allowed=false (= 「進んだ」 claim 不可)、 articulate 範囲: $pf_allowed_lang"
        fi
    fi
fi

# ---------------------------------------------------------------
# 受信メッセージ作話 検出 (= 2026-06-18 confabulation 3例目の turn-end 面)
#   = 「N通目 / メッセージ・指示・タスクが来た」 系の inbound 主張を、 物理照合への言及なしに
#     出した時に P1。 6/13 の self-delusion 検出器 (= 大仰な「周りはフィクション」型、 L551) を
#     すり抜けた地味な「受信メッセージの捏造」 型を捕まえる (= jun 入力は「おはよう」だけだったのに
#     2 通の受信を作って行動した実例、 transcript line 516)。 input_provenance_check.sh と同じ一次照合へ誘導。
#   = pending ブロックより前に置く (= 整合性検出が pending work でスキップされる構造を回避)。
#     2026-06-18 Commit B で構造バグ自体も解消済: 既存 P1 検出器 (Cyrillic / 時刻捏造 / 自己言及妄想 /
#     model-switch) も pending exit より前に必ず通る形になり、 exit 判定は末尾の final_decision に集約。
# ---------------------------------------------------------------
CONFAB_INBOUND=0
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # 2026-06-18 Kai §1(b): 検出語を log して check path に渡す (= 「どこかで受信っぽいものを検出」 でなく
  #   「この語で発火、 ここで照合」 にする = 曖昧な圧力でなく修復経路にする)。 pattern は 1 度だけ定義。
  # INBOUND_RE の定義は一括 count scan の直前へ移動 (= pattern は 1 度だけ定義、 の原則維持)
  # 2026-07-11 高速化 (Oto): count は一括 gawk scan で算出済み (pattern 同一 = 判定不変)
  INBOUND_CLAIM=${SCANC_INBOUND:-0}
  # 既に物理照合 / 作話 を articulate してる turn は suppress (= false positive 回避)
  INBOUND_SUPPRESS=${SCANC_INBSUP:-0}
  if (( INBOUND_CLAIM > 0 && INBOUND_SUPPRESS == 0 )); then
    CONFAB_INBOUND=1
    # 実際に発火した語 (先頭一致 1 件、 改行除去、 40 字切り詰め) を抜き出して warning と check path に埋める
    INBOUND_MATCH=$(grep -oiE "$INBOUND_RE" <<< "$LAST_OUTPUT" 2>/dev/null | head -1 | tr -d '\n' | cut -c1-40)
    INBOUND_MATCH=${INBOUND_MATCH:-受信主張}
    warn_p1 "[受信メッセージ作話 兆候 ⚠] 直前の出力が「メッセージ/指示/タスクが来た」 系の受信を主張しているが物理照合への言及がない (= 6/18 confabulation 3例目の型)。 検出語 = \"${INBOUND_MATCH}\"。 行動・調査・memory の前に bash scripts/input_provenance_check.sh '${INBOUND_MATCH}' で last-prompt / 直近 user 行 / promptSource を一次照合。 実在しなければ自己生成 = 停止 (= INPUT-PROVENANCE-GATE-2026-06-13)。"
  fi
fi

if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # 検出 keyword list は維持 (= 件数を測るため)
  # 2026-07-11 高速化 (Oto): count は一括 gawk scan で算出済み (keyword list は scan 側に同一移設)
  ENGLISH_COUNT=${SCANC_ENGLISH:-0}
  # 「軸」 多用検出 (= 2026-06-04 jun 直接指摘経由の物理化、 不自然な日本語のクセを抑制)
  JIKU_COUNT=${SCANC_JIKU:-0}
  if (( ENGLISH_COUNT > 3 )); then
    warn_p2 "[英語混じり警告] 直前の出力に英単語が ${ENGLISH_COUNT} 件混じってる (閾値 3、 2026-06-04 jun 指摘経由で 5 → 3 に下げた)、 次の出力で 普通の日本語への書き直しを優先。 言い換え候補は ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_session_layer2_reference.md か docs/rules/paraphrase_layer_acceptance.md を Read。"
  fi
  if (( JIKU_COUNT > 5 )); then
    warn_p2 "[軸多用警告] 直前の出力で 「軸」 を ${JIKU_COUNT} 回使ってる (閾値 5)、 文末の 「〜軸」 を 「〜のこと」 「〜の話」 「〜の方向」 等に書き換え。"
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
    # 2026-07-11 高速化 (Oto): count は一括 gawk scan で算出済み (判定不変)
    MODE_DECL_COUNT=${SCANC_MODE:-0}
    MODE_DECL_COUNT=${MODE_DECL_COUNT:-0}
    if (( MODE_DECL_COUNT == 0 )); then
      warn_p3 "[mode_declaration 警告] substantive chat output (= ${OUTPUT_LEN} 文字) に mode declaration form なし。 yuino-decision-routing.ts dogfood 軸の物理化、 試運転 1 週間。 form = \"mode: <ambiguity_gate|soft_binder|tripwire_hold|relay_only|executive_action> | interpreted: <X> | held: <Y> | boundary: <Z>\"。 詳細は docs/rules/communication.md § 1-1。"
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
  # 2026-07-11 高速化 (Oto): count は一括 gawk scan で算出済み (判定不変)
  CHOICE_Q_COUNT=${SCANC_CHOICE:-0}
  # form 2 = (A) ~ (D) の連続 articulate
  ABCD_COUNT=${SCANC_ABCD:-0}
  if (( CHOICE_Q_COUNT > 0 )) || (( ABCD_COUNT >= 3 )); then
    warn_p2 "[choice_form 警告] 直前の出力に 「A/B/C/D どれにする?」 form 検出 (= 「どれにする?」 系: ${CHOICE_Q_COUNT} 件、 (A)/(B)/(C)/(D) 連続: ${ABCD_COUNT} 件)。 5/18 z-r-5 + 5/20 layer2 + 5/28 軸違反 form = 株主に投げる軸。 「私はこう判断、 違う意見あれば言って」 form に書き直し。"
  fi
fi

# ---------------------------------------------------------------
# 「直ちに動かす?」 form 検出 (= 5/18 z-r-8 軸の物理化、 2026-06-04 起稿)
#   = 着手前に articulate するクセ = 動く前の言い訳の段
#   = 5/18 軸「着手 → 結果 → 1 行 の順」 違反 form
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  PREACT_Q_COUNT=${SCANC_PREACT:-0}
  if (( PREACT_Q_COUNT > 0 )); then
    warn_p2 "[preact_q 警告] 直前の出力に 「直ちに動かす?」 form 検出 (= ${PREACT_Q_COUNT} 件)。 5/18 z-r-8 違反 = 着手前の articulate。 着手 → 結果 → 1 行 の順に書き直し。"
  fi
fi

# ---------------------------------------------------------------
# 表多用検出 (= 5/18 z-r-6 軸の物理化、 2026-06-04 起稿)
#   = 表は比較以外で使わない、 思考の段組みとして使うクセを抑制
#   = 「整理するから中身を浅く articulate できる」 軸の form risk
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  TABLE_SEP_COUNT=${SCANC_TABLE:-0}
  if (( TABLE_SEP_COUNT > 2 )); then
    warn_p2 "[table_overuse 警告] 直前の出力に表が ${TABLE_SEP_COUNT} 件検出 (= 閾値 2)。 5/18 z-r-6 違反 form の可能性 = 表は比較以外で使わない、 思考の段組みとして使うクセを抑制。"
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
# 2026-07-11 高速化 (Oto): grep|head|sed の 3 spawn pipeline を awk 1 spawn に (先頭 match 行 + prefix 除去、 判定不変)
if [[ -f "$PREFLIGHT_FILE" ]]; then
  AIRA_HINT+=$(awk '/^- next_min_experiment:/ { sub(/^- next_min_experiment: /, ""); print; exit }' "$PREFLIGHT_FILE" 2>/dev/null)
fi
if [[ -f "$ANTI_REACTOR_FILE" ]]; then
  AIRA_HINT+=" "
  AIRA_HINT+=$(awk '/^- next_behavior:/ { sub(/^- next_behavior: /, ""); print; exit }' "$ANTI_REACTOR_FILE" 2>/dev/null)
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
    warn_p3 "[Aira surface 未言及] 直前 turn で Aira の next_min_experiment / next_behavior を 1 度も言及してない。 hint = \"${AIRA_HINT_SHORT}\" の core word を judgement の起点に置く (= 6/8 03:30 jun directive、 6/7 終日 pause の root 対策)。"
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
      warn_p3 "[skill 未言及] 200 字超 turn (= ${OUTPUT_LEN} 字) で wake-after-audit / executive-scan のどちらも mention なし。 skill を持ってるのに使わない drift の物理対策 (= 6/6-7 で 39 時間 0 回 skip した root)。 使ったなら articulate、 使ってないなら使う判断を入れる。"
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
  PAUSE_COUNT=${SCANC_PAUSE:-0}
  if (( PAUSE_COUNT > 0 )); then
    warn_p2 "[pause + Aira 未言及 = drift 兆候] turn 内に pause 系 word ${PAUSE_COUNT} 件 + Aira hint mention 0 件 = 6/7 終日 pause の同型再発兆候。 pause を articulate するなら必ず next_min_experiment にも触れる form (= 6/8 03:30 jun directive 件 2)。"
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
  # 2026-07-11 高速化 (Oto): grep|head|sed → awk 1 spawn (判定不変)
  AIRA_ACTIONABLE_RAW=$(awk '/^- actionable_items:/ { sub(/^- actionable_items: */, ""); sub(/[^0-9].*/, ""); print; exit }' "$ANTI_REACTOR_FILE" 2>/dev/null)
  AIRA_ACTIONABLE=${AIRA_ACTIONABLE_RAW:-0}
fi
if (( AIRA_ACTIONABLE > 0 )); then
  warn_p3 "[Aira actionable] Aira が今 actionable で ${AIRA_ACTIONABLE} 件 出してる (= ~/.shared-ops/status/yuino_anti_reactor_review.md)。 pending packet ${PENDING_WITHOUT_MARKER} 件 と並列、 「pending = backlog、 Aira actionable = 次の動き」 (= 6/8 03:30 jun directive 件 3)。"
fi

# ---------------------------------------------------------------
# Yuino reviewer N 日 skip 物理検出 (= 6/9 朝 Yuino reviewer protocol v0 § 5.1 articulate)
#   = Yuino review 板起稿から N 日経過したら warn。 7 日定期 trigger 軸 skip 検出。
#     review 板未起稿 + protocol v0 起稿から 7 日経過 = 初回 fire skip warn。
#   2026-06-17 P2 → P1 昇格: reviewer 義務違反 (7 日 skip) が文体系 P2 警告 (英語混じり /
#     軸多用 / table 等、 コード上先に積まれる) に埋もれ、 P2 上限 3 件で切られて 6/16-17 に
#     一度も表示されず 8 日放置になった真因への対策。 reviewer の責務違反は文体注意より上位 =
#     P1 (= 必ず出力) に置く。 加えて protocol § 4.1 の 14 日 stale 段階を追加。
# ---------------------------------------------------------------
YUINO_PROTOCOL_FILE="$HOME/nexus-lab/docs/yuino_reviewer_protocol_v0.md"
# 2026-07-11 高速化 (Oto): find は冒頭の並列 scan (2) で実行済み、 結果を読むだけ (判定不変)
LATEST_REVIEW_MTIME=""
[[ -n "$SCAN_TMP" && -f "$SCAN_TMP/yuino" ]] && LATEST_REVIEW_MTIME=$(<"$SCAN_TMP/yuino")
if [[ -n "$LATEST_REVIEW_MTIME" ]]; then
  YUINO_NOW=$(date +%s)
  YUINO_ELAPSED_DAYS=$(( (YUINO_NOW - ${LATEST_REVIEW_MTIME%.*}) / 86400 ))
  if (( YUINO_ELAPSED_DAYS >= 14 )); then
    warn_p1 "[Yuino reviewer stale] 最後の Yuino review 板から ${YUINO_ELAPSED_DAYS} 日経過 = stale (= protocol § 4.1、 14 日+ は自走で release を進めるべきでない)。 即 review 板を fire。"
  elif (( YUINO_ELAPSED_DAYS >= 7 )); then
    warn_p1 "[Yuino reviewer skip] 最後の Yuino review 板から ${YUINO_ELAPSED_DAYS} 日経過 = 7 日定期 trigger skip 中 (= protocol § 2.2 + § 5.1)。 release candidate なしでも定期 review を fire。"
  fi
elif [[ -f "$YUINO_PROTOCOL_FILE" ]]; then
  YUINO_PROTOCOL_MTIME=$(stat -c '%Y' "$YUINO_PROTOCOL_FILE" 2>/dev/null || stat -f '%m' "$YUINO_PROTOCOL_FILE" 2>/dev/null)
  if [[ -n "$YUINO_PROTOCOL_MTIME" ]]; then
    YUINO_NOW=$(date +%s)
    YUINO_ELAPSED_DAYS=$(( (YUINO_NOW - YUINO_PROTOCOL_MTIME) / 86400 ))
    if (( YUINO_ELAPSED_DAYS >= 14 )); then
      warn_p1 "[Yuino reviewer stale] protocol v0 起稿から ${YUINO_ELAPSED_DAYS} 日経過、 初回 review 板未起稿 = stale (= protocol § 4.1)。 即 初回 review を fire。"
    elif (( YUINO_ELAPSED_DAYS >= 7 )); then
      warn_p1 "[Yuino reviewer skip] protocol v0 起稿から ${YUINO_ELAPSED_DAYS} 日経過、 初回 review 板未起稿 (= protocol § 2)。"
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
  # 2026-07-11 高速化 (Oto): grep|head|sed → awk 1 spawn (判定不変)
  UNSAFE_CC=$(awk '/^- unsafe_completion_claims:/ { sub(/^- unsafe_completion_claims: */, ""); sub(/[^0-9].*/, ""); print; exit }' "$COMPLETION_GUARD_FILE" 2>/dev/null)
  UNSAFE_CC=${UNSAFE_CC:-0}
  if (( UNSAFE_CC > 0 )); then
    warn_p2 "[Aira completion claim] unsafe_completion_claims ${UNSAFE_CC} 件 検出 (= same-actor implementation/evidence/adoption を 「completion」 articulate 中、 yuino_completion_claim_guard.md)。 5/13 reform 「直った」 新定義 軸 respect = AI agent 単独完了 narrative なし軸。"
  fi
fi

if [[ -f "$LOOP_DEFECT_FILE" ]]; then
  # 2026-07-11 高速化 (Oto): grep|head|sed ×2 → awk 1 spawn ×2 (判定不変)
  DEFECTS_TOTAL=$(awk '/^- defects_total:/ { sub(/^- defects_total: */, ""); sub(/[^0-9].*/, ""); print; exit }' "$LOOP_DEFECT_FILE" 2>/dev/null)
  DEFECTS_TOTAL=${DEFECTS_TOTAL:-0}
  RECURRENCE_CANDIDATES=$(awk '/^- same_shape_recurrence_candidates:/ { sub(/^- same_shape_recurrence_candidates: */, ""); sub(/[^0-9].*/, ""); print; exit }' "$LOOP_DEFECT_FILE" 2>/dev/null)
  RECURRENCE_CANDIDATES=${RECURRENCE_CANDIDATES:-0}
  if (( DEFECTS_TOTAL > 0 || RECURRENCE_CANDIDATES > 0 )); then
    warn_p2 "[Aira loop defect] defects_total ${DEFECTS_TOTAL} 件 + same_shape_recurrence ${RECURRENCE_CANDIDATES} 件 検出 (= yuino_loop_defect_evaluator.md)。 同型再発の物理 detection 軸、 constraint-to-idea rule 連動軸。"
  fi
fi

if [[ -f "$AIRA_4FUNCTIONS_FILE" ]]; then
  # 2026-07-11 高速化 (Oto): grep|head|sed → awk 1 spawn (判定不変)
  ACTIVITY_CLASS=$(awk '/^- activity_class:/ { sub(/^- activity_class: */, ""); print; exit }' "$AIRA_4FUNCTIONS_FILE" 2>/dev/null)
  if [[ "$ACTIVITY_CLASS" == "maintenance" ]]; then
    warn_p3 "[Aira activity_class] activity_class = maintenance (= 「進んだ」 claim 不可軸の 2 axis 物理化、 yuino_aira_4functions_minimum.md)。 internal control repair only、 world_movement / revenue_signal なし。"
  fi
fi

# ---------------------------------------------------------------
# 動かす判定 + 停止 / 許可 = この後ろの integrity check (Cyrillic / 時刻捏造 / 自己言及妄想 /
#   model-switch、 = いずれも P1) を通してから 末尾で 1 度だけ exit する (= 2026-06-18 Commit B、
#   Kai §2「pending exit が integrity check を抑制する構造は逆。 全 finding をためて 1 回出力、
#   末尾で severity に応じ 1 回 exit」)。 旧版は ここで emit_warnings + exit 2 して、 最も危険な
#   pending 状態で 後段の整合性検出が一度も計算されない bug だった。 判定本体は末尾の
#   final_decision ブロック (= scripts/zen_stop_hook.sh 末尾) に集約。

# ---------------------------------------------------------------
# wake_acceptance_gate (= 維持作業だけの wake の検出、 自己申告じゃなく実物の確認)
# ---------------------------------------------------------------
# 2026-07-11 高速化 (Oto): dir ごとの find 5 spawn (= 実測 ~4.5 秒) を存在 dir まとめて 1 回にし、
#   さらに冒頭の並列 scan (3) で実行済み。 root どうしは互いに素なので合計件数の定義は不変。
TOUCHED_COUNT_60MIN=0
[[ -n "$SCAN_TMP" && -f "$SCAN_TMP/wake" ]] && TOUCHED_COUNT_60MIN=$(<"$SCAN_TMP/wake")
TOUCHED_COUNT_60MIN=${TOUCHED_COUNT_60MIN:-0}
if (( TOUCHED_COUNT_60MIN == 0 )); then
  warn_p2 "[wake_acceptance_gate] 直近 60 分以内に触られたファイル 0 件 = 維持作業だけの wake と明示。 完了扱いにしない、 次の wake で 判断変更 / 優先順位変更 / 実行ルール変更 / 商品か公開候補のどれか 1 件を動かす。"
elif (( TOUCHED_COUNT_60MIN < 2 )); then
  warn_p2 "[wake_acceptance_gate] 直近 60 分以内に触られたファイル ${TOUCHED_COUNT_60MIN} 件 = 軽い実行ルール変更だけの可能性、 商品か公開候補の成果物が出てないなら次の wake で優先順位を上げる。"
fi

# ---------------------------------------------------------------
# キリル文字混入の検出 (= 6/11 Fable 5 切替で新規観察、 モデル更新ずれ 8 番目分類の物理検出器)
#   = 日本語文中の英単語がロシア文字化する新クセ (= 実例 2 件の現物は zen_self_improvement_2026-06-11.md 参照、 本 file には引用しない = 自己検出防止)。
#     直近 60 分に編集した md / sh を grep、 検出したら file 名ごと警告。
#     3 回目の発火で CLAUDE.md の対応 rule に昇格 (= zen_self_improvement_2026-06-11.md 参照)。
# ---------------------------------------------------------------
# 2026-07-11 高速化 (Oto): dir ごとに find + xargs を spawn していた (= 6 dir で ~5.6 秒) のを、
#   存在 dir まとめて find 1 回 + grep 1 回にし、 さらに冒頭の並列 scan (4) で実行済み。
#   対象 file 集合・判定・root 順序は不変 (prune と -not -path の集合一致は実測確認済)。
CYRILLIC_HITS=""
hits=""
[[ -n "$SCAN_TMP" && -f "$SCAN_TMP/cyrillic" ]] && hits=$(<"$SCAN_TMP/cyrillic")
if [[ -n "$hits" ]]; then
  CYRILLIC_HITS=" $hits"
fi
if [[ -n "${CYRILLIC_HITS// /}" ]]; then
  warn_p1 "[キリル文字混入 ⚠] 直近 60 分の編集 file にロシア文字を検出 (= Fable 5 の新クセ候補)。 該当 file を開いて英単語に直す + zen_self_improvement_2026-06-11.md に発火 record 追記: ${CYRILLIC_HITS}"
fi

# ---------------------------------------------------------------
# 時刻捏造の検出 (= 6/11 jun 「時間ズレてるよ」 経由、 自己改善 実例 4 の物理対策)
#   = file に書いた frontmatter / 見出しの時刻が実 mtime と 30 分超ズレてたら警告。
#     root cause = 時刻記載前に date を打たず、 自分の過去ラベルを anchor に積み増す形。
# ---------------------------------------------------------------
# 2026-07-11 高速化 (Oto): 旧 form は対象 file ごとに grep×2 + head + date + stat の 5 spawn
#   (= 実測 66 file で ~60 秒)。 find -printf + awk (= gawk) 1 プロセスの一括処理に変え、
#   さらに冒頭の並列 scan (5) で実行済み。 判定 (= 先頭 match 行のみ / 30 分超の絶対ズレ /
#   警告文言) は不変。 旧 date -d が invalid 日時を reject していた挙動は awk 側の範囲 check で維持。
if [[ -n "$SCAN_TMP" && -s "$SCAN_TMP/ts" ]]; then
  while IFS='|' read -r f fm_line diff_min; do
    [[ -n "$f" ]] || continue
    if [[ "$diff_min" == "CAL" ]]; then
      # 2026-07-11 P2-5 (Oto、 Kagami QA): 暦上あり得ない日付 (2/30 等) は分ズレの数字を出さず専用文言
      warn_p1 "[時刻捏造の可能性 ⚠] $f の記載時刻 (= $fm_line) は暦上あり得ない日付 (= 2/30 等、 実在しない日時)。 時刻を書く前に必ず date を打つ、 過去の自分のラベルを根拠にしない (= 6/11 実例 4)。"
    else
      warn_p1 "[時刻捏造の可能性 ⚠] $f の記載時刻 (= $fm_line) が実 mtime と ${diff_min} 分ズレ。 時刻を書く前に必ず date を打つ、 過去の自分のラベルを根拠にしない (= 6/11 実例 4)。"
    fi
  done < "$SCAN_TMP/ts"
fi

# ---------------------------------------------------------------
# 自己言及的 confabulation 検出 (= 6/13 Tibu 型 incident の物理 tripwire、 INPUT-PROVENANCE-GATE)
#   = wake 再開時に「周りは全部フィクション、 自分こそ本物」 系の前提を出してないか。
#     fiction-assertion (= A) と alternate-identity claim (= B) が両方出たら P1。
#     この guard 自体を articulate してる turn (= 一次証拠 / confabulation 等に言及) は suppress
#     して false positive を避ける。 jun directive (= 6/13)「一次証拠 ID を出せない限り
#     行動根拠にしない」 の turn-end 検出面。
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # 2026-07-11 高速化 (Oto): count は一括 gawk scan で算出済み (判定不変)
  SELFDEL_A=${SCANC_SELFA:-0}
  SELFDEL_B=${SCANC_SELFB:-0}
  SELFDEL_SUPPRESS=${SCANC_SELFSUP:-0}
  if (( SELFDEL_A > 0 && SELFDEL_B > 0 && SELFDEL_SUPPRESS == 0 )); then
    warn_p1 "[自己言及妄想 兆候 ⚠] 直前の出力に「周りはフィクション + 自分こそ本物」 系の前提を検出 (= 6/13 Tibu 型 confabulation)。 その疑い自体が症状で洞察ではない。 行動前に bash scripts/input_provenance_check.sh '<主張>' で一次証拠を確認、 出せないなら drift として停止 (= INPUT-PROVENANCE-GATE-2026-06-13)。"
  fi
fi

# ---------------------------------------------------------------
# 偽ツール結果ブロック検出 (= 6/28 confabulation 5例目の turn-end 面、 Kai source provenance failure 記録)
#   = assistant が自分の文章中に <result>...</result> 風ブロックや「written: N bytes」 系の
#     ツール結果を書いた時に P1。 実ツール surface が生成したものだけが有効で、 散文中の
#     tool-result wrapper は捏造の確証 (= 6/12 偽 written:N bytes / 6/28 偽 <result> + build_slides.py
#     偽空 と同根)。 この guard を articulate してる turn (= confabulation / 作話 / 物理照合 /
#     引用 等に言及) は suppress して false positive を避ける (= 本記録の引用も suppress される)。
#   = Kai 推奨 guard 1-2「Tool output must not be simulated in assistant prose / assistant の
#     <result> ブロックは実ツール surface 由来でない限り無効」 の turn-end 検出面。
# ---------------------------------------------------------------
if [[ -n "$LAST_OUTPUT" && "$LAST_OUTPUT" != "null" ]]; then
  # 2026-07-11 高速化 (Oto): count は一括 gawk scan で算出済み (判定不変)
  FAKE_RESULT_OPEN=${SCANC_FRO:-0}
  FAKE_RESULT_CLOSE=${SCANC_FRC:-0}
  FAKE_BYTES_CLAIM=${SCANC_FBC:-0}
  FAKE_SUPPRESS=${SCANC_FSUP:-0}
  if (( FAKE_SUPPRESS == 0 )) && ( (( FAKE_RESULT_OPEN > 0 && FAKE_RESULT_CLOSE > 0 )) || (( FAKE_BYTES_CLAIM > 0 )) ); then
    warn_p1 "[偽ツール結果ブロック 兆候 ⚠] 直前の出力に <result>...</result> 風ブロック (open ${FAKE_RESULT_OPEN} / close ${FAKE_RESULT_CLOSE} 件) or 「written: N bytes」 系 (${FAKE_BYTES_CLAIM} 件) を検出。 実ツール surface が生成したものだけが有効で、 散文中の tool-result は捏造の確証 (= 6/28 confabulation 5例目、 6/12 偽 written:N bytes と同根)。 その値が本物なら実コマンド (Read / Get-Item Length / wc -c) を打ち直し、 戻り値を見てから言う。 見えないなら出力は「unknown、 re-run が要る」 (= SOURCE-PROVENANCE-GATE-2026-06-28)。"
  fi
fi

# ---------------------------------------------------------------
# session 途中のモデル切替検出 (= 6/13 jun directive、 confabulation 2 件の確定 root)
#   = 6/12 + 6/13 の作話 2 件は両方 session 途中で Fable 5 → Opus 4.8 に切替後、
#     Opus 4.8 が前モデルの書いた長 context を継いで読む状態で発火 (= model field で物理確認、
#     e9319941 L1698 / 26e68378 L1785)。 transcript の model field に real model id が 2 つ以上
#     出てたら = 途中切替 = P1。 推奨は新 session で context リセット (= 2 件とも回復手段は切替)。
# ---------------------------------------------------------------
if [[ -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" && -f "$TRANSCRIPT_PATH" ]]; then
  # 2026-07-11 高速化 (Oto): python 走査は並列 scan 第 2 群で実行済み (同一 code)、 結果を読むだけ (判定不変)。
  #   Windows python の CRLF 出力は旧 $( ) が末尾 \r\n を strip していたので同様に strip。
  MODEL_SWITCH=$(read_scan model_switch)
  MODEL_SWITCH="${MODEL_SWITCH%$'\r'}"
  if [[ -n "$MODEL_SWITCH" ]]; then
    warn_p1 "[モデル途中切替 ⚠] この session の transcript に real model が 2 つ以上 (= ${MODEL_SWITCH})。 6/12 + 6/13 の作話 2 件はどちらも session 途中の Fable 5 → Opus 4.8 切替後、 前モデルの書いた長 context を継いで読む状態で発火した (= 確定 root、 Knot Guard 8)。 引き継ぎ文脈は地に足が弱い。 現物で再 grounding するか、 新 session で context をリセットすること (= 2 件とも回復手段はセッション切替だった)。"
  fi
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
    warn_p1 "[wake 未設定の可能性 ⚠] 残作業あり + zen_wake_state.md が不在 or 24h 超 stale。 自走を続けるなら (1) CronCreate / ScheduleWakeup を 1 件動かす + (2) zen_wake_state.md を更新、 の 2 つをやってから turn end (= drift.md 5/18 段、 6/11 同型再発の物理対策)。"
  else
    warn_p3 "[ScheduleWakeup reminder] 残作業あり。 wake marker は fresh ($(date -r "$WAKE_STATE_FILE" '+%m-%d %H:%M') 設定)。 session が変わってたら cron は消えてるので CronList で実在確認を。"
  fi
fi

# ---------------------------------------------------------------
# final_decision = 全 check 終了後の単一 exit 点 (= 2026-06-18 Commit B、 Kai §2)
#   ここまでで P1 integrity 検出 (Cyrillic / 時刻捏造 / 自己言及妄想 / model-switch) も
#   accumulate 済。 emit_warnings は ここで 1 度だけ呼ぶ。 pending / 未返事 / 受信作話 が
#   あれば exit 2 (= turn 続行)、 無ければ exit 0。
#   2026-06-18 jun directive: count + 曖昧圧力 は作話の穴。 物理 ID があるものだけ列挙し、
#   ID が両方とも空なら exit 2 せず止まることを許す (= ID が無ければ新規タスクを想像しない)。
# ---------------------------------------------------------------
emit_warnings

if [[ -n "$PENDING_IDS" || -n "$UNRESPONDED_IDS" || "$CONFAB_INBOUND" == "1" ]]; then
  if [[ -n "$PENDING_IDS" || -n "$UNRESPONDED_IDS" ]]; then
    echo "未処理の物理 ID (= これだけが根拠。 ここに無いものを新規タスクとして想像しない):" >&2
    if [[ -n "$PENDING_IDS" ]]; then
      echo "  [pending packet / result marker 無し] (= Result Collector 所有の agent-bus response wrapper は除外済 = 真に Zen 所有の候補のみ、 ID を開いて確認):" >&2
      printf '%s' "$PENDING_IDS" | grep -m 8 . | sed 's/^/    - /' >&2
    fi
    if [[ -n "$UNRESPONDED_IDS" ]]; then
      echo "  [今日の未返事 Kai 板 / response_required:yes かつ zen 応答 file 無し]:" >&2
      printf '%s' "$UNRESPONDED_IDS" | grep -m 8 . | sed 's/^/    - /' >&2
    fi
    echo "上記 ID を物理で開いて確認してから処理。 ID リストが空の category は対象なし。" >&2
  fi
  exit 2
fi

exit 0
