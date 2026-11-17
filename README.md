# Lumina Commerce

[![CI](https://github.com/J-Andika/lumina-commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/J-Andika/lumina-commerce/actions/workflows/ci.yml)

A production-shaped headless commerce storefront: a Next.js App Router frontend talking to a
purpose-built commerce API (Route Handlers + Prisma), with real Stripe test-mode checkout,
persistent orders, and an operational admin.

> **Status:** in development — stage 1 of 11 complete (scaffold, CI, Docker).
> Sandbox preview (ephemeral): <https://3000-001m7ma0xxphbkbh4k9qkh2a3x1.sbx.sandboxes-cloud.docker.com>
> — it may be offline when the sandbox is stopped; the permanent link lands in stage 10.

## What this is

- A custom storefront (catalog, faceted filtering, product pages, cart, checkout, receipt)
- A commerce backend in the same deploy: server-side pricing, stock, promo codes, orders
- An admin surface: today's orders, stock toggles, order status

## What this is not

- Not a Shopify headless build — the commerce engine here is purpose-built (see `docs/architecture.md`)
- No real payments (Stripe **test mode** only), no customer accounts, no email delivery
- No multi-currency, no regional tax, no shipping-carrier integration

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Primitives | Radix UI (headless) |
| Data | Prisma + SQLite |
| Payments | Stripe test mode (+ local sandbox mode) |
| Tests | Vitest, Playwright |
| Runtime | Docker (multi-stage, `node:24-alpine`, standalone) |

## Run locally

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

```bash
npm run lint        # eslint
npm run typecheck   # next typegen && tsc --noEmit
npm run test        # vitest
npm run build       # production build
```

## Development workflow

Branch, commit, PR, and deploy rules: [docs/workflow.md](./docs/workflow.md).

## Roadmap

- [x] Stage 1 — scaffold, design tokens, CI
- [ ] Stage 2 — Prisma schema + seed catalog
- [ ] Stage 3 — pricing / promo / cart domain + unit tests
- [ ] Stage 4 — storefront + URL-state filtering
- [ ] Stage 5 — product pages + JSON-LD
- [ ] Stage 6 — cart drawer, promo engine, wishlist, search
- [ ] Stage 7 — checkout, Stripe test mode, receipt
- [ ] Stage 8 — admin (Basic Auth), stock + order actions
- [ ] Stage 9 — E2E, a11y, performance budget
- [ ] Stage 10 — Docker deploy, backups, uptime check
- [ ] Stage 11 — packaging: README, video, gig assets

## License

MIT — see [LICENSE](./LICENSE).
