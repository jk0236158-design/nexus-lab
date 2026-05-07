#!/bin/bash
# ui_visual_verify_check.sh — UI / frontend 変更時 self-verify ritual 1 step 化
# memory feedback_ui_visual_verify_skip_drift.md enforcement reify (5/07 PM 2 連発火 reform v1+v2+v3)、 5/07 PM 23:42 起稿
#
# self-verify 4 step:
#   Step 1: dev server 起動 check (port 3100)
#   Step 2: 全 route HTTP 200 check (curl)
#   Step 3: HTML expected element grep
#   Step 4: GET API 動作 check
#
# Playwright MCP screenshot 経由 visual verify は本 script 範囲外 (Claude Code 経由 manual invoke)
#
# usage:
#   ./scripts/ui_visual_verify_check.sh
#   ./scripts/ui_visual_verify_check.sh --routes /,/dogfood,/approval (default 同)
#   ./scripts/ui_visual_verify_check.sh --port 3100 (default)

set -uo pipefail

PORT=3100
ROUTES="/,/dogfood,/approval"
HOST="http://127.0.0.1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="$2"
      shift 2
      ;;
    --routes)
      ROUTES="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,15p' "$0"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

BASE="${HOST}:${PORT}"
red_count=0

echo "═══════════════════════════════════════════════"
echo "ui_visual_verify_check: ${BASE}"
echo "═══════════════════════════════════════════════"

# Step 1: dev server check (port hold)
echo ""
echo "── Step 1: dev server (port ${PORT}) 起動 check ──"
if ! netstat -ano 2>/dev/null | grep -E "[:.]${PORT}\s" | grep -qE 'LISTEN(ING)?'; then
  red_count=$((red_count + 1))
  echo "  🔴 port ${PORT} 未起動、 dev server 立ち上げ必須"
  echo "     例: cd packages/ops-console && pnpm dev"
  exit 2
fi
echo "  ✓ port ${PORT} active"

# Step 2: 全 route HTTP 200
echo ""
echo "── Step 2: 全 route HTTP 200 check ──"
IFS=',' read -ra ROUTE_ARRAY <<< "$ROUTES"
for route in "${ROUTE_ARRAY[@]}"; do
  url="${BASE}${route}"
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "  ✓ ${route}: ${status}"
  else
    red_count=$((red_count + 1))
    echo "  🔴 ${route}: ${status} (200 期待)"
  fi
done

# Step 3: HTML expected element grep (root page で <main> + <h1> 期待)
echo ""
echo "── Step 3: HTML expected element grep ──"
root_html=$(curl -s --max-time 10 "${BASE}/" 2>/dev/null || true)
if [[ -z "$root_html" ]]; then
  red_count=$((red_count + 1))
  echo "  🔴 root HTML 取得失敗"
else
  if echo "$root_html" | grep -qE '<main|<h1|<header'; then
    echo "  ✓ HTML expected element 検出 (<main> or <h1> or <header>)"
  else
    red_count=$((red_count + 1))
    echo "  🔴 HTML expected element 不在 (空 page or error page candidate)"
  fi
fi

# Step 4: GET API check (existence of /api/* if applicable)
echo ""
echo "── Step 4: GET API 動作 check ──"
api_count=$(echo "$root_html" | grep -oE '"/api/[^"]+"' | sort -u | wc -l | tr -d ' ' || true)
api_count=${api_count:-0}
if [[ "$api_count" -gt 0 ]]; then
  echo "  API endpoint detect: ${api_count} 件"
  for api in $(echo "$root_html" | grep -oE '"/api/[^"]+"' | sort -u | head -3); do
    api_clean=$(echo "$api" | tr -d '"')
    api_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE}${api_clean}" || echo "000")
    if [[ "$api_status" == "200" ]]; then
      echo "    ✓ ${api_clean}: ${api_status}"
    else
      echo "    🟡 ${api_clean}: ${api_status} (確認推奨)"
    fi
  done
else
  echo "  (API endpoint なし or detect skip)"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "ui_visual_verify_check summary:"
echo "  red:    ${red_count}"
echo "  source: ${BASE}"
echo "═══════════════════════════════════════════════"

if [[ "$red_count" -gt 0 ]]; then
  echo ""
  echo "⚠️  red ${red_count} 件、 公開前に解消必須"
  echo "   reference: memory/feedback_ui_visual_verify_skip_drift.md"
  echo "   注意: 本 check は HTML transport check のみ、 actual visual rendering verify は"
  echo "         Playwright MCP screenshot 経由で別途 manual invoke 必須"
  exit 2
fi

echo "✓ ui_visual_verify_check passed (transport check)"
echo "  注意: visual rendering verify は Playwright MCP screenshot で別途確認推奨"
exit 0
