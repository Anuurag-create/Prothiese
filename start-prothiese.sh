#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/services/clarum/backend"
SITE="$ROOT/frontend/site"
PYTHON="$BACKEND/.venv/bin/python"
if [[ ! -x "$PYTHON" ]]; then PYTHON="python3"; fi

if [[ ! -f "$BACKEND/.env" ]]; then
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo "Created services/clarum/backend/.env. Add your Gemini API key, then rerun."
  exit 1
fi
if [[ ! -d "$SITE/clarum/assets" ]]; then
  echo "Clarum frontend is not built. Run npm ci and npm run build in services/clarum/frontend first."
  exit 1
fi

(cd "$BACKEND" && "$PYTHON" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000) &
API_PID=$!
(cd "$ROOT" && python3 -m http.server 8080 --directory "$SITE") &
WEB_PID=$!
trap 'kill "$API_PID" "$WEB_PID" 2>/dev/null || true' EXIT
sleep 2
printf 'Prothiese is running at http://127.0.0.1:8080\nPress Ctrl+C to stop both services.\n'
wait
