# Runbook — production host

Everything here was executed on the host before it was written down.

## Topology

```
Internet ──TLS──> Caddy :443 ──> 127.0.0.1:3010 ──> Docker container "lumina-prod"
                                                        │
                                        volume "lumina-data" (/data/lumina.db)
```

- App image: multi-stage `Dockerfile`, runtime `node:24-bookworm-slim`, `next start` on 3000 inside the container.
- The host port is bound to **127.0.0.1** (`BIND=127.0.0.1`) so the only way in is the reverse proxy.
- SQLite lives on a named volume, not in the image; redeploys keep data.

## First deploy

```bash
git clone --depth 1 https://github.com/J-Andika/lumina-commerce.git /opt/lumina
cat > /opt/lumina/lumina.env <<'EOF'
DATABASE_URL=file:/data/lumina.db
PAYMENTS_MODE=sandbox
ADMIN_USER=admin
ADMIN_PASS=<generated>
EOF
chmod 600 /opt/lumina/lumina.env

cd /opt/lumina
APP_DIR=/opt/lumina ENV_FILE=/opt/lumina/lumina.env \
BIND=127.0.0.1 PORT=3010 CONTAINER=lumina-prod VOLUME=lumina-data \
bash scripts/deploy.sh
```

`deploy.sh` clones or resets to `origin/main`, builds `runner` and `migrator`, runs
`prisma migrate deploy` + seed inside the network namespace of the volume, restarts the
container, and fails the deploy if `/api/health` does not answer within 60 s.

## Deploy a new version

Same command. The script is idempotent: fetch, hard reset, rebuild, migrate, restart, health.

```bash
cd /opt/lumina && APP_DIR=/opt/lumina ENV_FILE=/opt/lumina/lumina.env   BIND=127.0.0.1 PORT=3010 CONTAINER=lumina-prod VOLUME=lumina-data bash scripts/deploy.sh
```

## Rollback

The image tag is stable (`lumina-commerce:latest`), so roll back by rebuilding a known tag:

```bash
cd /opt/lumina && git fetch --tags
git checkout v0.9.0
APP_DIR=/opt/lumina ENV_FILE=/opt/lumina/lumina.env   BIND=127.0.0.1 PORT=3010 CONTAINER=lumina-prod VOLUME=lumina-data bash scripts/deploy.sh
git checkout main
```

Migrations are forward-only; if the bad release migrated the schema, restore the backup
taken before the deploy (below) instead of rolling back only the image.

## Backups

```bash
bash /opt/lumina/scripts/ops/backup.sh    # writes /opt/lumina/backups/lumina-YYYYmmdd-HHMM.db.gz
crontab -e                                # 15 3 * * * bash /opt/lumina/scripts/ops/backup.sh
```

The script copies the live database with `sqlite3 .backup` (safe under WAL), runs
`PRAGMA integrity_check` on the copy, and only then rotates, keeping the last 7 files.

## Restore

```bash
docker stop lumina-prod
VOL=/var/lib/docker/volumes/lumina-data/_data
gunzip -c /opt/lumina/backups/lumina-20261128-0315.db.gz > "$VOL/lumina.db"
rm -f "$VOL"/lumina.db-wal "$VOL"/lumina.db-shm
docker start lumina-prod
curl -fsS http://127.0.0.1:3010/api/health
```

## Health and monitoring

```bash
bash /opt/lumina/scripts/ops/healthcheck.sh   # appends to /opt/lumina/health.log, exits 1 on failure
curl -fsS https://95-111-212-87.sslip.io/api/health
```

Cron: `*/5 * * * * bash /opt/lumina/scripts/ops/healthcheck.sh` — the log is the on-call trail;
point an external uptime monitor at `/api/health` for real alerting.

## TLS

Caddy terminates TLS with an automatic certificate for the `sslip.io` name (the DNS name encodes
the host IP, so no domain purchase is needed). Config lives in `scripts/ops/Caddyfile` and is
installed at `/etc/caddy/Caddyfile`.

## Post-deploy smoke test

```bash
BASE_URL=https://95-111-212-87.sslip.io node scripts/ops/smoke.mjs
```

Buys one product through the real UI with the sandbox card and asserts the receipt shows
`Paid`. Run it after every deploy; it caught a `SQLITE_READONLY` volume-permission bug that
the health endpoint could not see.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| 502 from Caddy | `docker ps`, `docker logs --tail 50 lumina-prod` |
| Health 500 | `docker exec lumina-prod sh -lc 'ls -l /data'` — volume mounted? |
| Orders not saving | disk full: `df -h /`, then prune old images `docker image prune -f` |
| `SQLITE_READONLY` in the logs | the volume is owned by root; `deploy.sh` now chowns `/data` to 1001 and the runner image pre-creates it. Repair in place: `docker run --rm --user 0 -v lumina-data:/data --entrypoint sh lumina-commerce:latest -c 'chown -R 1001:1001 /data && chmod -R u+rwX,g+rwX /data'` |
| Build fails on `better-sqlite3` | the `deps` stage needs `python3 make g++`; do not switch to alpine |
