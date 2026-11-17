#!/usr/bin/env bash
# Runs INSIDE the sandbox. Pulls latest main, rebuilds the image, restarts the container.
# Usage: bash scripts/deploy.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/lumina-commerce}"
IMAGE="${IMAGE:-lumina-commerce:latest}"
CONTAINER="${CONTAINER:-lumina-demo}"
PORT="${PORT:-3000}"
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

echo "==> build"
docker build -t "$IMAGE" "$APP_DIR"

echo "==> restart"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "127.0.0.1:${PORT}:3000" \
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
