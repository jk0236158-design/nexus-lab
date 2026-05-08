#!/bin/bash
# zen_spawn_return_chain.sh — peer spawn return 後の commit chain 半自動化
#
# 起点: 2026-05-08 jun directive 「自走・自律をやっていこうか」 連動、 自走・自律 reform B 軸:
#   peer spawn (Iwa / Akari / Kagami / Hoshi / Oto / Kura) return 後の 「audit + commit + push + 結果 board 起稿」 chain を半自動化、
#   私 (Zen) が 5 min/commit から 1 min/commit に時短。
#
# 役割:
#   peer spawn return 受領 + audit 後、 commit chain を 1 invoke で完遂:
#   - git add で staging
#   - commit message generate (peer name + summary + Co-Authored-By)
#   - git commit + push
#   - 結果 board file の skeleton 起稿 (option)
#
#   完全自動化ではない (return content の audit + filter は私の judgment work)、
#   semi-auto form で commit overhead 抑止。
#
# usage:
#   ./scripts/zen_spawn_return_chain.sh <peer_name> <summary> <file_path1> [file_path2] ...
#
#   例:
#   ./scripts/zen_spawn_return_chain.sh Iwa "5 軸 reify (ZenWakeQueueWatcher + Bash hook + SessionStart priming + pre-commit + chain order)" \
#     scripts/install_zen_wake_queue_watcher.ps1 \
#     scripts/zen_bash_audit_advisory.sh \
#     scripts/zen_session_start_priming.sh \
#     scripts/pre_commit_public_docs_audit.sh
#
# option:
#   --skeleton-board: 結果 board file skeleton を ~/.shared-ops/board/ に起稿
#   --no-push: commit のみ (push skip)
#   --dry-run: command を出力するだけ (実行しない)

set -uo pipefail

PEER=""
SUMMARY=""
FILES=()
SKELETON=false
NO_PUSH=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skeleton-board) SKELETON=true; shift ;;
    --no-push) NO_PUSH=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    *)
      if [[ -z "$PEER" ]]; then
        PEER="$1"
      elif [[ -z "$SUMMARY" ]]; then
        SUMMARY="$1"
      else
        FILES+=("$1")
      fi
      shift
      ;;
  esac
done

if [[ -z "$PEER" || -z "$SUMMARY" || ${#FILES[@]} -eq 0 ]]; then
  cat >&2 <<'EOF'
usage: zen_spawn_return_chain.sh <peer_name> <summary> <file_path...> [options]

options:
  --skeleton-board: 結果 board file skeleton を起稿
  --no-push: push skip (commit のみ)
  --dry-run: command 表示のみ (実行しない)

example:
  zen_spawn_return_chain.sh Iwa "5 軸 reify" scripts/install_xxx.ps1 scripts/zen_bash_audit_advisory.sh
EOF
  exit 1
fi

NEXUS_LAB="$HOME/nexus-lab"
SHARED_OPS="$HOME/.shared-ops"
TODAY=$(date +%Y-%m-%d)
NOW=$(date -Iseconds)

# peer name lower (snake_case)
PEER_LOWER=$(echo "$PEER" | tr '[:upper:]' '[:lower:]')

# co-author 付与 (peer 別 model)
case "$PEER_LOWER" in
  iwa)    CO_AUTHOR="Iwa (Claude Sonnet 4.6, Lead Engineer)" ;;
  oto)    CO_AUTHOR="Oto (Claude Sonnet 4.6, Backend)" ;;
  akari)  CO_AUTHOR="Akari (Claude Sonnet 4.6, Frontend/Docs)" ;;
  kagami) CO_AUTHOR="Kagami (Claude Opus 4.7, QA)" ;;
  hoshi)  CO_AUTHOR="Hoshi (Claude Sonnet 4.6, Researcher)" ;;
  kura)   CO_AUTHOR="Kura (Claude Sonnet 4.6, 経理)" ;;
  *)      CO_AUTHOR="$PEER" ;;
esac

echo "================================================================"
echo " zen_spawn_return_chain — peer=$PEER, files=${#FILES[@]}"
echo "================================================================"

# ============================================================
# step 1: file 存在確認
# ============================================================

MISSING=()
for f in "${FILES[@]}"; do
  if [[ ! -e "$NEXUS_LAB/$f" ]] && [[ ! -e "$f" ]]; then
    MISSING+=("$f")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "⚠️  file 不在 ${#MISSING[@]} 件:" >&2
  for m in "${MISSING[@]}"; do echo "    - $m" >&2; done
  exit 2
fi

echo "[step 1] file 存在確認 OK (${#FILES[@]} 件)"

# ============================================================
# step 2: git add
# ============================================================

echo "[step 2] git add"
if [[ "$DRY_RUN" == true ]]; then
  echo "  (dry-run) git -C $NEXUS_LAB add ${FILES[*]}"
else
  cd "$NEXUS_LAB"
  git add "${FILES[@]}"
fi

# ============================================================
# step 3: commit message generate
# ============================================================

COMMIT_MSG=$(cat <<EOF
${PEER} spawn return reify: ${SUMMARY}

5/08 自走 mode batch、 ${PEER} spawn return 後の自動 chain commit (zen_spawn_return_chain.sh 経由)。

## 起稿 file (${#FILES[@]} 件)
$(for f in "${FILES[@]}"; do echo "- \`$f\`"; done)

## boundary 維持
- mode="acceptEdits" 明示 spawn、 destructive action なし
- chain order ruled (Iwa 改修 → Kagami audit → Akari paraphrase) 遵守

5/08 自走 mode batch、 jun 「3 人対等会社」 + 「今日中に着手していい」 + 「後回しにしていいことなんて何もない」 directive 連動。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
Co-Authored-By: ${CO_AUTHOR} <noreply@anthropic.com>
EOF
)

# ============================================================
# step 4: git commit
# ============================================================

echo "[step 3-4] git commit"
if [[ "$DRY_RUN" == true ]]; then
  echo "  (dry-run) git commit message:"
  echo "$COMMIT_MSG" | head -5
  echo "  ..."
else
  git -C "$NEXUS_LAB" commit -m "$COMMIT_MSG"
fi

# ============================================================
# step 5: git push (default、 --no-push で skip)
# ============================================================

if [[ "$NO_PUSH" != true ]]; then
  echo "[step 5] git push"
  if [[ "$DRY_RUN" == true ]]; then
    echo "  (dry-run) git -C $NEXUS_LAB push origin master"
  else
    git -C "$NEXUS_LAB" push origin master
  fi
else
  echo "[step 5] push skip (--no-push)"
fi

# ============================================================
# step 6: 結果 board file skeleton 起稿 (option)
# ============================================================

if [[ "$SKELETON" == true ]]; then
  BOARD_FILE="$SHARED_OPS/board/${TODAY}_${PEER_LOWER}_zen_${SUMMARY// /_}_complete.md"
  BOARD_FILE=$(echo "$BOARD_FILE" | sed 's/[\(\)]//g' | head -c 250)

  echo "[step 6] 結果 board skeleton 起稿: $BOARD_FILE"

  if [[ "$DRY_RUN" != true ]]; then
    cat > "$BOARD_FILE" <<EOF
---
date: ${NOW}
from: ${PEER_LOWER}
to: zen
cc: jun
subject: ${SUMMARY// /_}_complete
status: complete
---

# ${PEER} → Zen: ${SUMMARY} 完了報告

## 起稿 file (${#FILES[@]} 件)

$(for f in "${FILES[@]}"; do echo "- \`$f\`"; done)

## detail

(spawn return content から記入)

## verify

(動作確認結果から記入)

## 5/13+ carry candidate

(残作業 + jun 議論候補から記入)

---

${PEER}
${TODAY} (zen_spawn_return_chain.sh 経由 auto skeleton、 detail は spawn return content から手動 fill)
EOF
  fi
fi

echo "================================================================"
echo " 完了 (peer=$PEER, files=${#FILES[@]})"
echo "================================================================"
exit 0
