#!/usr/bin/env bash
# Called after a sandbox stop/start: there is no systemd, so nothing auto-starts.
set -euo pipefail

CONTAINER="${CONTAINER:-lumina-demo}"

if ! docker info >/dev/null 2>&1; then
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 40); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "$CONTAINER already running"
else
  docker start "$CONTAINER"
fi

docker ps --filter "name=$CONTAINER" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
