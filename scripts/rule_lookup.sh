#!/usr/bin/env bash
# rule_lookup.sh — Rule Registry v0 を trigger 軸で引く物理化
#
# 起点: 2026-06-03 jun directive (= 「決めたルールを実行時に参照できない」 軸の物理対策)
# 元の registry = ~/.shared-ops/rules/rule_registry_v0_2026-06-03.md (= 28 rule + 36 trigger)
#
# 使い方:
#   bash scripts/rule_lookup.sh <trigger 名>      = trigger に該当する rule の id + summary を出力
#   bash scripts/rule_lookup.sh --list-triggers   = 利用可能な trigger 一覧 (= 36 件)
#   bash scripts/rule_lookup.sh --list-rules      = 全 rule_id 一覧 (= 28 件)
#
# 例:
#   bash scripts/rule_lookup.sh before_public_post   = 公開投稿前の rule 5 件
#   bash scripts/rule_lookup.sh file_create          = file 起稿時の rule 5 件
#   bash scripts/rule_lookup.sh npm_publish_patch_minor = patch/minor 公開時の自走判定軸
#
# 注意:
#   - registry の source は read-only、 この script は trigger 軸の参照面のみ提供
#   - must_read: true の rule は ★ で marking
#   - 元 source 軸を読みたい時は source_path を直接 read

set -uo pipefail

REGISTRY="$HOME/.shared-ops/rules/rule_registry_v0_2026-06-03.md"
TRIGGER="${1:-}"

if [[ ! -f "$REGISTRY" ]]; then
    echo "rule_registry_v0 が見つからない: $REGISTRY" >&2
    echo "= path を確認 (= 起稿時の path 軸は 2026-06-03)" >&2
    exit 1
fi

case "$TRIGGER" in
    ""|--help|-h)
        cat <<'EOF'
使い方:
  bash scripts/rule_lookup.sh <trigger 名>      = trigger に該当する rule の id + summary を出力
  bash scripts/rule_lookup.sh --list-triggers   = 利用可能な trigger 一覧 (= 36 件)
  bash scripts/rule_lookup.sh --list-rules      = 全 rule_id 一覧 (= 28 件)

例:
  bash scripts/rule_lookup.sh before_public_post
  bash scripts/rule_lookup.sh file_create
  bash scripts/rule_lookup.sh npm_publish_patch_minor

= 元の registry = ~/.shared-ops/rules/rule_registry_v0_2026-06-03.md
EOF
        exit 0
        ;;
esac

# Windows path 軸の python 渡し (= cygpath 経由)
if command -v cygpath >/dev/null 2>&1; then
    REGISTRY_WIN=$(cygpath -w "$REGISTRY")
else
    REGISTRY_WIN="$REGISTRY"
fi

REGISTRY_PATH="$REGISTRY_WIN" TRIGGER="$TRIGGER" PYTHONIOENCODING=utf-8 python -X utf8 - <<'PYEOF'
import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

with open(os.environ['REGISTRY_PATH'], encoding='utf-8') as f:
    src = f.read()

trigger = os.environ['TRIGGER']

if trigger == '--list-triggers':
    m = re.search(r'trigger_index:\n(.*?)```', src, re.DOTALL)
    if not m:
        print('trigger_index 軸が見つからない', file=sys.stderr)
        sys.exit(1)
    for line in m.group(1).split('\n'):
        sm = re.match(r'^  ([a-z_0-9]+):\s*$', line)
        if sm:
            print(sm.group(1))
    sys.exit(0)

if trigger == '--list-rules':
    for m in re.finditer(r'- rule_id: ([A-Z0-9\-]+)', src):
        print(m.group(1))
    sys.exit(0)

# trigger lookup
m = re.search(r'trigger_index:\n(.*?)```', src, re.DOTALL)
if not m:
    print('trigger_index 軸が見つからない', file=sys.stderr)
    sys.exit(1)
tindex = m.group(1)
block = re.search(
    r'^  ' + re.escape(trigger) + r':\s*\n((?:    - .+\n)+)',
    tindex, re.MULTILINE,
)
if not block:
    print(f'trigger 「{trigger}」 は registry に未登録', file=sys.stderr)
    print('利用可 trigger 一覧: bash scripts/rule_lookup.sh --list-triggers', file=sys.stderr)
    sys.exit(2)
rule_ids = re.findall(r'    - ([A-Z0-9\-]+)', block.group(1))

print(f'=== trigger: {trigger} ===')
print(f'= 該当 rule: {len(rule_ids)} 件')
print()

for rid in rule_ids:
    pat = re.compile(
        r'- rule_id: ' + re.escape(rid) +
        r'\n(.*?)(?=\n  - rule_id:|\n  # ===|\n```|$)',
        re.DOTALL,
    )
    em = pat.search(src)
    if not em:
        print(f'[{rid}] = registry 内で本文未検出')
        print()
        continue
    body = em.group(1)
    summ = re.search(r'summary_ja: (「.*?」)', body, re.DOTALL)
    must = re.search(r'must_read: (\w+)', body)
    srcp = re.search(r'source_path: (\S+)', body)
    marker = '★' if must and must.group(1) == 'true' else '・'
    print(f'{marker} [{rid}]')
    if summ:
        text = re.sub(r'\n\s+', ' ', summ.group(1))
        print(f'  {text}')
    if srcp:
        print(f'  source: {srcp.group(1)}')
    print()
PYEOF
