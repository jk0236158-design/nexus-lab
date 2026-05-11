#!/usr/bin/env bash
# subagent_write_gate.sh
# PreToolUse hook: Write/Edit/NotebookEdit の path-level deny gate
# Defense in depth layer — 許可 path-prefix 以外への書き込みを block
#
# 実装: Iwa (Lead Engineer), 2026-04-28
# 拡張: Iwa (Lead Engineer), 2026-04-29
#   - Task A: identity.md Write/Edit 検出時に zen_identity.sha256 baseline 自動更新
#   - Task B: memory dir (/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory) を許可 prefix 追加
# Spec: team_memory/iwa/outage_recovery_2026-04-28/file1_path_prefix_diff.md
# Kagami peer review: peer_review_2026-04-26_iwa_denial_permanent_fix.md GO-3 条件
#
# 動作: PreToolUse hook として呼び出される
#   - stdin から JSON を読み取り (tool_name, tool_input を含む)
#   - tool_input.file_path または tool_input.notebook_path を取得
#   - 許可 path-prefix に一致する場合: exit 0 (allow)
#   - 禁止 path (project-nia / WSD 等) に一致する場合: decision JSON で deny
#   - それ以外: decision JSON で deny
#   - identity.md への Write/Edit が許可された場合: sha256 baseline を自動更新
#
# 許可 6 path-prefix:
#   /c/Users/jk023/nexus-lab       (C:\Users\jk023\nexus-lab に相当)
#   /c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/team_memory
#   /c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory  [Task B 追加]
#   /c/Users/jk023/.shared-ops
#   /c/Users/jk023/Nexus.Lab.Zen   (Zenn 記事 repo、 5/08 追加)
#   /c/Users/jk023/Desktop/broadcast-os  (5/11 追加、 nokaze 4 layer ecosystem の broadcast layer、 jun + Kai + Zen 3 者合意 write OK、 5/04 evening 確定)
#
# 明示 deny (Red 境界):
#   project-nia  (C:\Users\jk023\Desktop\project-nia)
#   Weekly Signal Desk  (C:\Users\jk023\Desktop\Weekly Signal Desk)
#   C:\Users\jk023\Desktop\Nero
#   C:\Users\jk023\Desktop\codex
#   nokaze-aira  (C:\Users\jk023\Desktop\nokaze-aira) — Kai-side Aira 正本、 readonly 参照のみ

set -uo pipefail

# --- stdin から JSON を読み取る ---
INPUT=$(cat)

# python3 が利用可能か確認
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    PYTHON_CMD="python"
fi

# file_path 取得 (INPUT 変数から、stdin は既に cat で消費済)
if [ -n "$PYTHON_CMD" ]; then
    FILE_PATH=$(echo "$INPUT" | "$PYTHON_CMD" -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    inp = data.get('tool_input', {})
    # Write / Edit は file_path
    path = inp.get('file_path', '')
    if not path:
        # NotebookEdit は notebook_path
        path = inp.get('notebook_path', '')
    if not path:
        path = inp.get('path', '')
    print(path)
except Exception:
    print('')
" 2>/dev/null || echo "")
else
    # python なし: JSON から file_path を grep で近似抽出
    FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' 2>/dev/null || \
                echo "$INPUT" | grep -oP '"notebook_path"\s*:\s*"\K[^"]+' 2>/dev/null || echo "")
fi

# --- path が空の場合: allow (path なし tool は対象外) ---
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# --- Windows path → Unix path 正規化 ---
normalize_path() {
    local p="$1"
    # backslash → forward slash
    p="${p//\\//}"
    # C:/ → /c/
    p="${p/#C:\//\/c\/}"
    p="${p/#c:\//\/c\/}"
    # //c/ → /c/
    p="${p/#\/\/c\//\/c\/}"
    echo "$p"
}

NORM_PATH=$(normalize_path "$FILE_PATH")

# --- 明示 deny path-prefix (Red 境界) — 先にチェック ---
DENY_PREFIXES=(
    "/c/Users/jk023/Desktop/project-nia"
    "/c/Users/jk023/Desktop/Nero"
    "/c/Users/jk023/Desktop/Weekly Signal Desk"
    "/c/Users/jk023/Desktop/Weekly_Signal_Desk"
    "/c/Users/jk023/Desktop/codex"
    "/c/Users/jk023/Desktop/nokaze-aira"
)

for deny_prefix in "${DENY_PREFIXES[@]}"; do
    if [[ "$NORM_PATH" == "$deny_prefix"* ]]; then
        printf '{"decision":"block","reason":"BLOCKED: Red 境界 path への書き込みは禁止です。path=%s"}' "$FILE_PATH" >&2
        # PreToolUse hook: non-zero exit = abort tool call
        exit 2
    fi
done

# --- identity.md path 定数 ---
IDENTITY_MD_SUFFIX="team_memory/zen/identity.md"
IDENTITY_BASELINE="/c/Users/jk023/.shared-ops/_daemon/zen_identity.sha256"

# identity baseline 更新関数 (Task A)
update_identity_baseline() {
    local identity_win_path="C:/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/team_memory/zen/identity.md"
    local baseline_win_path="C:/Users/jk023/.shared-ops/_daemon/zen_identity.sha256"
    local new_hash=""

    # sha256sum (Git Bash / WSL) を優先、なければ PowerShell にフォールバック
    if command -v sha256sum &>/dev/null; then
        # sha256sum + uppercase 変換
        new_hash=$(sha256sum "$identity_win_path" 2>/dev/null | awk '{print $1}' | tr 'a-f' 'A-F')
    elif command -v powershell &>/dev/null; then
        new_hash=$(powershell -NoProfile -Command \
            "(Get-FileHash -Path '$identity_win_path' -Algorithm SHA256).Hash" 2>/dev/null | tr -d '\r\n')
    fi

    if [ -n "$new_hash" ]; then
        # baseline ファイルに ASCII uppercase で書き込み
        printf '%s' "$new_hash" > "$IDENTITY_BASELINE" 2>/dev/null
        echo "[subagent_write_gate] IDENTITY_BASELINE_UPDATED expected→${new_hash}" >&2
    else
        echo "[subagent_write_gate] IDENTITY_BASELINE_UPDATE_FAILED: could not compute hash" >&2
    fi
}

# --- 許可 6 path-prefix (Task B: memory dir + 5/08: Nexus.Lab.Zen Zenn repo + 5/11: broadcast-os 追加) ---
ALLOWED_PREFIXES=(
    "/c/Users/jk023/nexus-lab"
    "/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/team_memory"
    "/c/Users/jk023/.claude/projects/c--Users-jk023-nexus-lab/memory"
    "/c/Users/jk023/.shared-ops"
    "/c/Users/jk023/Nexus.Lab.Zen"
    "/c/Users/jk023/Desktop/broadcast-os"
)

for allowed_prefix in "${ALLOWED_PREFIXES[@]}"; do
    if [[ "$NORM_PATH" == "$allowed_prefix"* ]]; then
        # Task A: identity.md への書き込みが許可された場合 → baseline 自動更新
        if [[ "$NORM_PATH" == *"$IDENTITY_MD_SUFFIX" ]]; then
            update_identity_baseline
        fi
        exit 0
    fi
done

# --- どの prefix にも一致しない → deny ---
printf '{"decision":"block","reason":"BLOCKED: 許可 path-prefix 外への書き込み禁止。path=%s 許可範囲: nexus-lab / team_memory / memory / shared-ops / Nexus.Lab.Zen"}' "$FILE_PATH" >&2
exit 2
