# Architecture

Living document. Updated whenever a structural decision changes.

## Runtime shape

- Next.js 16 App Router, server components for reads, server actions for writes
- One route handler: `/api/stripe/webhook`; plus `/api/health`
- Prisma + SQLite, single writer, WAL mode

## Invariants

1. Prices, discounts, shipping, and stock are computed server-side. The client sends only
   `{ variantId, qty }`.
2. Money is integer cents everywhere; formatting happens at the edge.
3. `main` is always buildable and deployable.
4. No secret ever reaches the client bundle.

## Schema changes

Prisma 7 does not regenerate the client on `migrate dev`, so the order is:

```bash
npx prisma migrate dev --name <change>
npx prisma generate
npm run db:seed
```

CI runs `prisma migrate deploy` on a throwaway database before lint/typecheck/tests.
Tests use their own file (`prisma/test.db`) created by `src/server/testing/global-setup.ts`.

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-11-17 | SQLite + Prisma over Postgres | Zero-ops single-node deploy in Docker; no external account needed |
| 2026-11-17 | Stripe test mode with sandbox fallback | Real integration without KYC; demo survives key rotation |
| 2026-11-17 | Radix primitives over hand-rolled dialogs | Focus management is where custom demos break |
