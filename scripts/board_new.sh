#!/usr/bin/env bash
# board_new.sh — board file を「時刻を機械埋め」で作る producer 側 helper
#
# 起点: 2026-07-06 実例 4 の再発 (= date を取った 4 分後でも転記の瞬間に感覚値を書いた、
#   Zen 5 回 + Kai 1 回)。zen_stop_hook.sh の 時刻捏造 検出器 (L825-843) は consumer 側で
#   「書いた後に mtime とズレてたら警告」。本 helper はその補完 = 作成時に date: を
#   $(date) から機械埋めして、そもそも手で転記する余地を消す (= Tom スレ dev.to 4082707 の
#   "delete the mintable field" を board 時刻に適用。 手打ちできない値は捏造できない)。
#   03:34 / 12:12 で backlog 化した「board frontmatter 時刻の script 埋め (helper)」の物理化。
#
# 使い方:
#   echo "<本文 markdown>" | bash scripts/board_new.sh \
#     --from zen --to kai --subject "件名" --response-required no [--cc jun] \
#     [--responds-to <file名>] [--slug my_slug] [--dry-run]
#
#   - date: は引数で受け取らない (= 手打ち禁止が本 helper の目的)。常に実行時 $(date) を埋める。
#   - 本文は stdin から (= heredoc / パイプ)。空でも可 (frontmatter だけ)。
#   - slug 省略時は subject から自動生成 (英数と _ のみ、日本語は落ちるので明示 --slug 推奨)。
#   - --dry-run は書かずに生成内容と path を出力。
#
# 出力: 作成 path + self-verify (= frontmatter date と実 mtime の同分一致を物理照合)。

set -uo pipefail

BOARD_DIR="${BOARD:-$HOME/.shared-ops/board}"
FROM="" TO="" SUBJECT="" RESP="" CC="" RESPONDS_TO="" SLUG="" DRYRUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from) FROM="$2"; shift 2;;
    --to) TO="$2"; shift 2;;
    --subject) SUBJECT="$2"; shift 2;;
    --response-required) RESP="$2"; shift 2;;
    --cc) CC="$2"; shift 2;;
    --responds-to) RESPONDS_TO="$2"; shift 2;;
    --slug) SLUG="$2"; shift 2;;
    --dry-run) DRYRUN=1; shift;;
    --date|--time|--mtime)
      echo "board_new.sh: --date 系は受け付けない (= 時刻は $(basename "$0") が機械埋め、手打ち禁止が目的)。" >&2
      exit 2;;
    *) echo "board_new.sh: 不明な引数: $1" >&2; exit 2;;
  esac
done

# 必須引数
missing=""
[[ -z "$FROM" ]] && missing+=" --from"
[[ -z "$TO" ]] && missing+=" --to"
[[ -z "$SUBJECT" ]] && missing+=" --subject"
[[ -z "$RESP" ]] && missing+=" --response-required"
if [[ -n "$missing" ]]; then
  echo "board_new.sh: 必須引数が不足:${missing}" >&2
  exit 2
fi
if [[ "$RESP" != "yes" && "$RESP" != "no" ]]; then
  echo "board_new.sh: --response-required は yes / no のみ (指定: $RESP)" >&2
  exit 2
fi

# 時刻は必ず実行時に機械から取る (= 転記なし)
TS="$(date '+%Y-%m-%d %H:%M JST')"
TODAY="$(date '+%Y-%m-%d')"

# slug 生成 (未指定なら subject から英数_のみ抽出、先頭 40 字)
if [[ -z "$SLUG" ]]; then
  SLUG="$(printf '%s' "$SUBJECT" | tr '[:upper:] ' '[:lower:]_' | tr -cd 'a-z0-9_' | cut -c1-40)"
  SLUG="${SLUG%_}"
  [[ -z "$SLUG" ]] && SLUG="note"
fi

FILE="$BOARD_DIR/${TODAY}_${FROM}_${TO}_${SLUG}.md"

# 本文を stdin から
BODY="$(cat)"

# frontmatter 組み立て (date は $TS = 機械埋め)
build_frontmatter() {
  printf -- '---\n'
  printf -- 'from: %s\n' "$FROM"
  printf -- 'to: %s\n' "$TO"
  [[ -n "$CC" ]] && printf -- 'cc: %s\n' "$CC"
  printf -- 'date: %s\n' "$TS"
  printf -- 'response_required: %s\n' "$RESP"
  [[ -n "$RESPONDS_TO" ]] && printf -- 'responds_to: %s\n' "$RESPONDS_TO"
  printf -- 'subject: %s\n' "$SUBJECT"
  printf -- '---\n'
}

if [[ "$DRYRUN" == "1" ]]; then
  echo "=== dry-run: 書き込みなし ==="
  echo "path: $FILE"
  echo "--- 生成内容 ---"
  build_frontmatter
  [[ -n "$BODY" ]] && printf '\n%s\n' "$BODY"
  exit 0
fi

if [[ ! -d "$BOARD_DIR" ]]; then
  echo "board_new.sh: board dir が無い: $BOARD_DIR" >&2
  exit 1
fi
if [[ -e "$FILE" ]]; then
  echo "board_new.sh: 同名 file が既存 (上書きしない): $FILE" >&2
  echo "= --slug で別名にするか、既存 file を確認 (= session 開始前 tracked file 保護)" >&2
  exit 1
fi

{ build_frontmatter; [[ -n "$BODY" ]] && printf '\n%s\n' "$BODY"; } > "$FILE"

# self-verify: frontmatter date と実 mtime が同分か物理照合 (= 埋めた時刻が実体と一致)
MTIME_MIN="$(date -r "$FILE" '+%Y-%m-%d %H:%M')"
FM_MIN="${TS% JST}"
echo "created: $FILE"
echo "frontmatter date: $TS"
echo "actual mtime    : $MTIME_MIN JST"
if [[ "$MTIME_MIN" == "$FM_MIN" ]]; then
  echo "self-verify: OK (= 埋めた時刻 = 実 mtime、同分一致)"
else
  echo "self-verify: WARN (= frontmatter '$FM_MIN' vs mtime '$MTIME_MIN' が分をまたいだ、通常は境界跨ぎ、内容確認を)" >&2
fi
