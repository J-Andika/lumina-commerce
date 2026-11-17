# Development workflow

Solo project, but run like a team repo. The goal is a commit history a client can audit and a
`main` branch that is always deployable.

## The loop

```
issue (acceptance criteria)
  → branch
    → commits (conventional, one logical change each)
      → PR (template + screenshot + green CI)
        → self-review the diff
          → squash merge
            → issue closed automatically
              → sandbox redeploy + /api/health check
```

## Branches

| Prefix | Use |
|---|---|
| `feat/<slug>` | user-facing capability |
| `fix/<slug>` | bug fix |
| `chore/<slug>` | tooling, CI, deps |
| `docs/<slug>` | documentation |
| `test/<slug>` | tests only |

One branch per issue. Keep it short-lived: merge within a day or two, otherwise rebase.

## Commits

Conventional Commits, imperative mood, subject ≤ 72 chars, no trailing period.

```
feat(cart): cap quantity at available stock
fix(promo): evaluate free-shipping threshold after discount
chore(ci): cache npm and cancel superseded runs
docs(readme): add measured Lighthouse numbers
```

Body explains **why**, not what. The diff already shows what.

Rules:

- One commit = one logical change. Do not mix a refactor with a feature.
- Every commit must build on its own (no "wip" commit on `main`; wip is fine on a branch).
- Never commit `.env*`, `*.db`, `node_modules`, or generated output.

## Pull requests

- Title = the squash commit message.
- Body: what changed, how to test, screenshot/clip for UI, checklist from the template.
- `Closes #<issue>` so merging closes the issue.
- CI must be green: `quality` and `build` are required checks.
- Self-review before merging: read the full diff as if someone else wrote it.
- Squash merge only; head branch auto-deleted.

## Definition of done (per issue)

- [ ] Acceptance criteria in the issue are met
- [ ] `npm run lint && npm run typecheck && npm run test` pass locally
- [ ] New logic has unit tests; new user flow has an E2E test (once the suite exists)
- [ ] Keyboard walkthrough done for anything interactive
- [ ] No secret, no committed DB, no debug logging
- [ ] PR merged, issue closed, demo redeployed, `/api/health` verified
- [ ] Milestone complete → annotated tag `v0.x.0` and GitHub Release notes

## Deploy loop

```bash
# after a merge to main
sbx --cloud exec lumina-demo -- sh -lc 'bash ~/lumina-commerce/scripts/deploy.sh'
curl -fsS https://3000-001m7ma0xxphbkbh4k9qkh2a3x1.sbx.sandboxes-cloud.docker.com/api/health
```

After a sandbox stop/start (no systemd inside), run `scripts/boot.sh` instead.

## Versioning

| Tag | Meaning |
|---|---|
| `v0.1.0` | scaffold + CI + Docker (stage 1) |
| `v0.2.0` … `v0.9.0` | one tag per completed milestone |
| `v1.0.0` | checkout + admin complete, demo published, README finished |
