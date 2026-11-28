# QA gates

Three gates run on every pull request, plus one that is manual.

| Gate | Command | Where | Failure means |
| --- | --- | --- | --- |
| Types + lint + unit | `npm run quality` | CI job `quality` | broken domain logic |
| Production build | `npm run build` | CI job `build` | the image would not ship |
| Browser suite | `npx playwright test` | CI job `e2e` | a user-visible flow is broken |
| Performance | see `docs/perf/summary.md` | manual, before a release | budgets in that file are exceeded |

## What the browser suite covers

- **Golden path** — add to cart → drawer → checkout (address → sandbox card → review) → paid receipt
- **Cart** — quantity, promo `DISKON10`, unknown code rejected, survives reload
- **Discovery** — wishlist round-trip, `/` opens search, Enter opens the first result
- **Admin** — 401 without credentials, dashboard renders with them
- **Accessibility** — axe (WCAG 2.1 A/AA) on `/`, `/shop`, PDP, `/wishlist`, checkout, admin, and the
  open cart drawer assert **zero critical or serious** violations; one keyboard-only test tabs to
  add-to-cart, opens the drawer with Enter, and reaches `/checkout` without a mouse

## Notes

- The e2e job builds, migrates, and seeds its own SQLite file (`e2e.db`), so it is independent from the
  developer database.
- `webServer` in `playwright.config.ts` starts the production server; traces and the HTML report are
  uploaded as an artifact when a job fails.
- Axe catches structural problems, not taste. The keyboard walkthrough is what proves the flows are
  usable without a pointer.
