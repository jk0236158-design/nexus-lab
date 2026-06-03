#!/usr/bin/env bash
# zen_session_start_priming_v2_draft.sh — セッション開始時の inject (v2 draft、 layer 1 = 常時読む のみ)
#
# 起点: 2026-05-20 PM jun + Kai reframe (= 「読む層を分ける」)
#   = layer 1 = 常時読む = zen_role 12 行 + 自走の状態 + 前夜の申し送り
#   = layer 2 = 必要時 read = `team_memory/zen/zen_session_layer2_reference.md`
#   = layer 3 = 実行直前 = CLAUDE.md の 自走 OK / jun 一声
#   = layer 4 = 報告前 = scripts/zen_stop_hook.sh
#
# 旧 v1 (= 364 行 inject) との違い:
#   旧 = 全 session start で 反省ログ + 失敗例 + 言い換え見本 + NG/OK 5 例 + 4 自問 + 主体性 + 4/15 核 + 道具リスト + Obsidian vault + peer 7 type を常時 inject
#        → 「反省中の作業者」 default を作る、 「萎縮」 + 「英語混じり」 + 「指示待ち」 の root
#   新 = 常時 inject は zen_role 12 行 (= CTO の役割) + 自走の状態 + 前夜の申し送り のみ
#        旧の content は layer 2 reference に move、 必要時に Read で取りに行く
#
# 完了条件: 起動後の挙動が 「CTO として動ける」 = 萎縮なし + 普通の日本語 + 次の安全な作業を自分で選べる
#
# やらないこと:
#   - 100 行を超える inject (= LLM の頭の容量を圧迫しない、 目安 60-80 行)
#   - 失敗ログを常時 inject (= 反省中の作業者 default を作らない)
#   - 言い換え candidate list を常時 echo (= 監督じゃなく作業者の文体を作る)
#
# status: DRAFT、 Kai audit 後 + jun startup 後に actual swap

set -uo pipefail

SHARED_OPS="$HOME/.shared-ops"
INBOX_DIR="$SHARED_OPS/inbox"
WAKE_QUEUE_DIR="$SHARED_OPS/wake-queue/zen"
TODAY_FILE="$SHARED_OPS/status/zen_today.md"
AIRA_STATUS_JSON="$SHARED_OPS/status/yuino_outcome_accounting.json"
ACTIVE_LANES_FILE="$SHARED_OPS/status/zen_active_lanes.md"
TODAY=$(date +%Y-%m-%d)

echo "=== Zen のセッション始まり (= layer 1 = 常時読む) ==="
echo ""

# ---------------------------------------------------------------
# Zen role (= zen_role_2026-05-20.md の 12 行、 layer 1 の核)
# ---------------------------------------------------------------
echo "■ Zen role (= nokaze / Nexus Lab の CTO):"
echo ""
echo "  あなたは nokaze / Nexus Lab の CTO。 反省中の作業者ではない。"
echo "  共同経営者の一人として、 自分で次の一手を決めて進める。"
echo ""
echo "  Jun の明示判断が必要なのは:"
echo "  - 支払い、 契約、 有料販売、 価格変更"
echo "  - 個人情報や未公開情報を含む外部公開"
echo "  - 初回のアカウント変更、 プロフィール変更"
echo "  - 炎上リスクがある内容、 他者に直接届く送信"
echo ""
echo "  無料の通常発信は、 既に合意した方針とアカウント範囲の中なら自分で進めてよい。"
echo "  報告は普通の日本語で短く書く。 英語ラベルや不自然な用語は使わない。"
echo "  作業が終わったら止まらず、 次に進める安全なローカル作業があるか確認する。"
echo "  不明点があっても、 調べれば分かることは自分で調べる。"
echo "  失敗ログは必要なときだけ参照する。 常時の文体や判断姿勢にはしない。"
echo ""

# ---------------------------------------------------------------
# 自走の状態 (= wake queue + notify、 数字だけ)
# ---------------------------------------------------------------
echo "■ 自走の状態:"

notify_count=0
if [[ -d "$INBOX_DIR" ]]; then
    notify_count=$(find "$INBOX_DIR" -maxdepth 1 -type f -name 'zen_wake_queue_pending_*.md' 2>/dev/null | wc -l | tr -d ' ')
fi
notify_count=${notify_count:-0}

queue_count=0
if [[ -d "$WAKE_QUEUE_DIR" ]]; then
    queue_count=$(find "$WAKE_QUEUE_DIR" -maxdepth 1 -type f -name 'controlled_*.md' 2>/dev/null | wc -l | tr -d ' ')
fi
queue_count=${queue_count:-0}

if [[ "$notify_count" -gt 0 ]]; then
    echo "  - 起こす通知: ${notify_count} 件"
fi
if [[ "$queue_count" -gt 0 ]]; then
    echo "  - 起こすキューの中身: ${queue_count} 件 (= 取り出し: scripts/zen_wake_queue_consume.sh)"
fi
if [[ "$notify_count" -eq 0 && "$queue_count" -eq 0 ]]; then
    echo "  - 起こす通知 / キュー: なし"
fi

if [[ -f "$TODAY_FILE" ]]; then
    chosen=$(grep -A1 '^## 選んだ1件' "$TODAY_FILE" 2>/dev/null | tail -1 | head -c 120 || true)
    if [[ -n "$chosen" ]]; then
        echo "  - zen_today.md の「選んだ 1 件」: ${chosen}"
    fi
fi

echo ""

# ---------------------------------------------------------------
# Aira Outcome Accounting (= 5/30 jun + Kai + Zen articulate land、 「世界の動き」 数字の出元)
#   = 「内部 commit を売上 progress と数えない」 軸の物理化
#   = status_json は Aira (Kai 主担当) が ~/.shared-ops/status/ に書く
#   = priming は read only、 古ければ refresh 推奨だけ表示
# ---------------------------------------------------------------
if [[ -f "$AIRA_STATUS_JSON" ]]; then
    # bash path (= /c/...) を Windows python 用 (= C:\...) に変換
    if command -v cygpath >/dev/null 2>&1; then
        AIRA_STATUS_JSON_WIN=$(cygpath -w "$AIRA_STATUS_JSON")
    else
        AIRA_STATUS_JSON_WIN="$AIRA_STATUS_JSON"
    fi
    aira_summary=$(AIRA_PATH="$AIRA_STATUS_JSON_WIN" python -c "
import json, os
try:
    d = json.load(open(os.environ['AIRA_PATH'], encoding='utf-8'))
    s = d.get('summary', {})
    print(d.get('business_date', '?'))
    print(s.get('world_movement_axes_counted', '?'))
    print(s.get('revenue_signal_count', '?'))
    print(s.get('conversion_gap_status', '?'))
    print(s.get('next_min_experiment', '')[:80])
except Exception as e:
    print('?'); print('?'); print('?'); print('?'); print('')
" 2>/dev/null)
    aira_date=$(echo "$aira_summary" | sed -n '1p')
    aira_world=$(echo "$aira_summary" | sed -n '2p')
    aira_revenue=$(echo "$aira_summary" | sed -n '3p')
    aira_gap=$(echo "$aira_summary" | sed -n '4p')
    aira_next=$(echo "$aira_summary" | sed -n '5p')

    echo "■ Aira (= 世界の動き、 内部 commit を売上と数えない軸):"
    if [[ "$aira_date" = "$TODAY" ]]; then
        echo "  - business_date: $aira_date (= 今日、 fresh)"
    else
        echo "  - business_date: $aira_date (= 古い、 refresh: bash scripts/zen_aira_refresh.sh)"
    fi
    echo "  - world_movement: $aira_world / revenue_signal: $aira_revenue / gap: $aira_gap"
    if [[ -n "$aira_next" ]]; then
        echo "  - 次の最小実験: $aira_next"
    fi
    echo ""
else
    echo "■ Aira: status_json 未生成 (= 初回 refresh: bash scripts/zen_aira_refresh.sh)"
    echo ""
fi

# ---------------------------------------------------------------
# Active Lanes (= 5/31 jun directive、 「やること散らばって参照できてない」 軸の物理対策)
#   = 5/22 dual-track + 4/24 路線 C/D の active 5 lane の canonical surface
#   = stale lane (= 直近 7 日以内に動いてない lane) を1 行 articulate、 「待ち」 default 防止
# ---------------------------------------------------------------
if [[ -f "$ACTIVE_LANES_FILE" ]]; then
    echo "■ Active Lanes (= 今日 Zen が動かす canonical index):"
    # Lane heading + 直近動き 行を 各 lane 1 件 抜粋 表示
    awk '
        /^## Lane [0-9]+:/ { lane=$0; sub(/^## /, "  - ", lane); print lane; in_lane=1; next }
        in_lane && /^- \*\*直近動き\*\*:/ {
            sub(/^- \*\*直近動き\*\*:/, "      直近:", $0)
            print $0
            in_lane=0
        }
    ' "$ACTIVE_LANES_FILE"
    echo "  (= 詳細: $ACTIVE_LANES_FILE)"
    echo ""
else
    echo "■ Active Lanes: zen_active_lanes.md 未生成 (= 初回 起稿軸)"
    echo ""
fi

# ---------------------------------------------------------------
# 前夜の申し送り (= 昨日の自分での確認から、 何が終わってないか + 翌朝の既定 を抜き出し)
# ---------------------------------------------------------------
LEDGER_DIR="${HOME}/Desktop/nokaze/ledger"
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d 2>/dev/null || python -c "from datetime import date, timedelta; print((date.today() - timedelta(days=1)).isoformat())" 2>/dev/null || true)
YESTERDAY_LEDGER="${LEDGER_DIR}/daily_audit/${YESTERDAY}.md"

if [[ -n "$YESTERDAY" && -f "$YESTERDAY_LEDGER" ]]; then
    last_sc_line=$(awk '/^## [0-9]+\..*self-check/ { ln=NR } END { print ln }' "$YESTERDAY_LEDGER")

    if [[ -n "$last_sc_line" && "$last_sc_line" -gt 0 ]]; then
        section_end=$(awk -v start="$last_sc_line" 'NR > start && /^## / { print NR-1; exit }' "$YESTERDAY_LEDGER")
        if [[ -z "$section_end" ]]; then
            section_end=$(wc -l < "$YESTERDAY_LEDGER")
        fi

        section_body=$(sed -n "${last_sc_line},${section_end}p" "$YESTERDAY_LEDGER")

        unfinished=$(echo "$section_body" | awk '
            /^### .*何が終わってないか/ { flag=1; next }
            flag && /^### / { exit }
            flag && /^## / { exit }
            flag && /^- / { print; count++ }
            flag && count >= 5 { exit }
        ' | head -5)

        next_default=$(echo "$section_body" | awk '
            /^### .*(翌朝 default|reform candidate|next move|next fire|priority)/ { flag=1; next }
            flag && /^### / { exit }
            flag && /^## / { exit }
            flag && /^---/ { exit }
            flag && /^$/ { blank++; if (blank >= 2) exit; next }
            flag && /^[0-9]+\. / { print; count++; blank=0 }
            flag && /^- [^0-9]/ && count == 0 { print; count++; blank=0 }
            flag && count >= 5 { exit }
        ' | head -5)

        if [[ -n "$unfinished" || -n "$next_default" ]]; then
            echo "■ 前夜の申し送り:"
            if [[ -n "$unfinished" ]]; then
                echo "  ◇ 何が終わってないか:"
                echo "$unfinished" | sed 's/^/    /'
            fi
            if [[ -n "$next_default" ]]; then
                echo "  ◇ 翌朝の既定の候補:"
                echo "$next_default" | sed 's/^/    /'
            fi
            echo "  元: $(basename "$YESTERDAY_LEDGER")"
            echo ""
        fi
    fi
fi

# ---------------------------------------------------------------
# 月初の見直し reminder (= 1 - 3 日のみ)
# ---------------------------------------------------------------
DAY_OF_MONTH=$(date +%d)
DOM_NUM=$((10#$DAY_OF_MONTH))
if [[ "$DOM_NUM" -ge 1 && "$DOM_NUM" -le 3 ]]; then
    echo "■ 月初 (= 1 - 3 日) の見直しの候補:"
    echo "  - 先月の memory feedback の同じ形の再発の確認"
    echo "  - Codex 経由の見直し (= scripts/codex-review.sh、 別の視点)"
    echo "  - 似たサービスとの比較"
    echo ""
fi

# ---------------------------------------------------------------
# layer 2 reference (= 必要時に Read で取りに行く)
# ---------------------------------------------------------------
echo "■ 必要時に読むもの (= 常時 inject から外した中身):"
echo "  - 動きの見本 + 言い回しの注意 + 4 自問 + 主体性 4 + 4/15 核 + 道具 + Obsidian vault + peer 7 型"
echo "    = ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/zen_session_layer2_reference.md"
echo "      (= 兆候が出た時 / 動きの form を確認したい時)"
echo "  - 過去の失敗ログ = ~/.claude/projects/c--Users-jk023-nexus-lab/memory/feedback_*.md (= 同じ形が出た時だけ)"
echo "  - CTO の判断の境界 = ~/nexus-lab/CLAUDE.md (= 自走 OK 6 件 / jun 一声 4 件)"
echo "  - 私が誰か = ~/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity_v3.md (= 不可侵 8 件)"
echo ""

# ---------------------------------------------------------------
# Rule Registry v0 (= 6/3 jun directive 軸の物理化、 「決めたルールが実行時に参照できない」 軸への対策)
#   = 28 rule + 36 trigger encode 済、 trigger 軸で実行時に引ける形
#   = 作業 type を 1 つ決めたら 該当 rule を 1 command で引く
# ---------------------------------------------------------------
echo "■ Rule Registry v0 (= 作業直前に trigger 軸で引く):"
echo "  - 索引: ~/.shared-ops/rules/rule_registry_v0_2026-06-03.md (= 38 rule + 68 trigger encode 済)"
echo "  - 引き方: bash scripts/rule_lookup.sh <trigger 名>"
echo "  - 例: before_public_post / file_create / npm_publish_patch_minor / before_money_action / docs_update / board_reply"
echo "  - trigger 一覧: bash scripts/rule_lookup.sh --list-triggers"
echo ""

echo "■ 始まりの読み込み完了"
echo "==========================="

exit 0
