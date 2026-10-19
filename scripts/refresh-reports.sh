#!/bin/zsh
# Monthly refresh: re-analyzes every product in the catalog with fresh public feedback,
# then commits and pushes the updated reports (Vercel redeploys from the push).
# Run by launchd (see scripts/com.snehalurs.atlas-refresh.plist); safe to run by hand too.

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.."

mkdir -p logs
exec >> "logs/refresh-$(date +%Y-%m).log" 2>&1
echo "=== Refresh started $(date) ==="

PORT=3456
export NEXT_DIST_DIR=.next-refresh

git pull --ff-only
brew services start ollama >/dev/null 2>&1 || true
until curl -sf http://localhost:11434/api/tags >/dev/null; do sleep 2; done

npx next build
npx next start -p $PORT &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
until curl -sf -o /dev/null http://localhost:$PORT; do sleep 1; done

caffeinate -i node scripts/generate-reports.mjs http://localhost:$PORT --refresh

if [[ -n "$(git status --porcelain src/data/reports)" ]]; then
  git add src/data/reports
  git commit -m "Refresh saved reports ($(date '+%B %Y'))"
  git push
  echo "Pushed refreshed reports."
else
  echo "No report changes to publish."
fi
echo "=== Refresh finished $(date) ==="
