# Deploy runbook — Docker cloud sandbox

The demo runs on a Docker cloud sandbox (`sbx`) to prove the Dockerfile on a clean Linux host.
A sandbox is **ephemeral and billed per second** — it is a demo/preview target, not a permanent
home. The persistent portfolio link goes to the VPS (stage 10, second half).

## 1. Create the sandbox

```bash
export PATH="$PATH:$LOCALAPPDATA/DockerSandboxes/bin"
sbx --cloud create shell --name lumina-demo --cpus 2 --memory 4g --ttl 12h --on-timeout stop
sbx --cloud ls
```

Port 3000 is published automatically; the public URL looks like
`https://3000-<sandbox-id>.sbx.sandboxes-cloud.docker.com` (read it from `sbx --cloud inspect`).

## 2. Bootstrap Docker inside the sandbox

The image ships the docker CLI but **no running daemon** and **no systemd**.

```bash
sbx --cloud exec lumina-demo -- sh -lc '
  echo "Dpkg::Options { \"--force-confdef\"; \"--force-confold\"; };" | sudo tee /etc/apt/apt.conf.d/90forceconf >/dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io curl git
  sudo nohup dockerd >/tmp/dockerd.log 2>&1 &
  sleep 5
  docker info >/dev/null && echo DOCKER_OK
'
```

## 3. Deploy

```bash
sbx --cloud exec lumina-demo -- sh -lc 'bash ~/lumina-commerce/scripts/deploy.sh'
```

First run clones the public repo, creates `~/lumina.env` with a random admin password,
builds the image, starts the container on 127.0.0.1:3000, and polls `/api/health`.

## 4. Verify

```bash
sbx --cloud inspect lumina-demo          # read the published URL for port 3000
curl -fsS "https://3000-<id>.sbx.sandboxes-cloud.docker.com/api/health"
```

## 5. After a stop/start

Processes die on stop. Run the boot script:

```bash
sbx --cloud exec lumina-demo -- sh -lc 'bash ~/lumina-commerce/scripts/boot.sh'
```

## Notes and limits

- SQLite lives on the `lumina-data` volume, so it survives container rebuilds, not `sbx rm`.
- `--on-timeout stop` keeps files but stops compute billing; `--on-timeout restart` costs 24/7.
- Never put real Stripe keys in the sandbox. `PAYMENTS_MODE=sandbox` is the default there.
- The sandbox URL must never be the only demo link in a portfolio: it can be offline at any time.
