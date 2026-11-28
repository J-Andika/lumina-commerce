#!/usr/bin/env bash
# Nightly SQLite backup from the Docker volume, verified before the old ones rotate out.
# Usage: bash /opt/lumina/scripts/ops/backup.sh
set -euo pipefail

VOLUME_DIR="${VOLUME_DIR:-/var/lib/docker/volumes/lumina-data/_data}"
DB="${VOLUME_DIR}/lumina.db"
DEST="${DEST:-/opt/lumina/backups}"
KEEP="${KEEP:-7}"

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M)"
OUT="$DEST/lumina-$STAMP.db"

sqlite3 "$DB" ".backup '$OUT'"
CHECK="$(sqlite3 "$OUT" 'PRAGMA integrity_check;')"

if [ "$CHECK" != "ok" ]; then
  echo "backup failed integrity check: $CHECK" >&2
  rm -f "$OUT"
  exit 1
fi

gzip -f "$OUT"
ls -1t "$DEST"/lumina-*.db.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm --
echo "backup ok: ${OUT}.gz ($(du -h "${OUT}.gz" | cut -f1))"
