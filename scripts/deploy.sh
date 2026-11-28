#!/usr/bin/env bash
# Runs INSIDE the sandbox. Pulls latest main, rebuilds the image, restarts the container.
# Usage: bash scripts/deploy.sh
#   BIND=127.0.0.1 keeps the port on localhost for a reverse proxy in front.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/lumina-commerce}"
IMAGE="${IMAGE:-lumina-commerce:latest}"
CONTAINER="${CONTAINER:-lumina-demo}"
PORT="${PORT:-3000}"
BIND="${BIND:-0.0.0.0}"
ENV_FILE="${ENV_FILE:-$HOME/lumina.env}"
VOLUME="${VOLUME:-lumina-data}"

echo "==> docker daemon"
if ! docker info >/dev/null 2>&1; then
  echo "dockerd not running; starting it (no systemd in this sandbox)"
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 40); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
  docker info >/dev/null 2>&1 || { echo "dockerd failed; see /tmp/dockerd.log"; exit 1; }
fi

echo "==> source"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch --prune origin
  git -C "$APP_DIR" reset --hard origin/main
else
  git clone --depth 1 https://github.com/J-Andika/lumina-commerce.git "$APP_DIR"
fi

echo "==> env file"
if [ ! -f "$ENV_FILE" ]; then
  ADMIN_PASS="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 16)"
  cat > "$ENV_FILE" <<EOF
DATABASE_URL=file:/data/lumina.db
PAYMENTS_MODE=sandbox
ADMIN_USER=admin
ADMIN_PASS=$ADMIN_PASS
EOF
  chmod 600 "$ENV_FILE"
  echo "created $ENV_FILE (admin password stored there)"
fi

echo "==> build app"
docker build --target runner -t "$IMAGE" "$APP_DIR"

echo "==> migrate + seed"
MIGRATOR_IMAGE="${IMAGE%:*}-migrator:latest"
STAMP_FILE="$(dirname "$ENV_FILE")/.migrate-stamp"
STAMP="$(
  cd "$APP_DIR"
  { cat prisma/schema.prisma; find prisma/migrations prisma/seed.ts -type f | sort | xargs cat; } \
    | sha256sum | cut -c1-16
)"

if [ "$(cat "$STAMP_FILE" 2>/dev/null || true)" = "$STAMP" ]; then
  echo "schema, migrations, and seed unchanged ($STAMP); reusing the migrator image"
else
  docker build --target migrator -t "$MIGRATOR_IMAGE" "$APP_DIR"
  docker run --rm \
    -v "${VOLUME}:/data" \
    --env-file "$ENV_FILE" \
    "$MIGRATOR_IMAGE" \
    sh -lc "npx prisma migrate deploy && npx tsx prisma/seed.ts && chown -R 1001:1001 /data && chmod -R u+rwX,g+rwX /data"
  echo "$STAMP" > "$STAMP_FILE"
fi

echo "==> restart"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "${BIND}:${PORT}:3000" \
  -v "${VOLUME}:/data" \
  --env-file "$ENV_FILE" \
  "$IMAGE"

echo "==> health"
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "healthy: $(curl -fsS "http://127.0.0.1:${PORT}/api/health")"
    exit 0
  fi
  sleep 1
done
echo "health check failed; logs:"; docker logs --tail 60 "$CONTAINER"; exit 1
