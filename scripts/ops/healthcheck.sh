#!/usr/bin/env bash
# Probe the running container and keep a one-line history. Exits non-zero on failure
# so cron mail or an external monitor can pick it up.
set -uo pipefail

URL="${URL:-http://127.0.0.1:3010/api/health}"
LOG="${LOG:-/opt/lumina/health.log}"

if BODY="$(curl -fsS --max-time 10 "$URL" 2>&1)"; then
  echo "$(date -Is) ok $BODY" >> "$LOG"
  exit 0
fi

echo "$(date -Is) FAIL $BODY" >> "$LOG"
exit 1
