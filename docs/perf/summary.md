# Performance budget — measured, not claimed

Run against the production build (`next build` + `next start`) on this machine, Lighthouse 12,
desktop preset, headless Chrome. Raw reports sit next to this file.

| Page | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | **99** | 100 | 100 | 100 | 0.29 s | 0.000 | 85 ms |
| `/shop` | **99** | 100 | 100 | 100 | 0.82 s | 0.000 | 62 ms |
| `/product/monolith` | **100** | 100 | 100 | 100 | 0.71 s | 0.000 | 41 ms |

Budget enforced by this document: **Perf ≥ 95, A11y 100, CLS < 0.05, LCP < 1.8 s, TBT < 200 ms.**

## Reproduce

```bash
npm run build
npx next start -p 3211
CHROME_PATH="/path/to/chrome" npx lighthouse http://127.0.0.1:3211/ \
  --preset=desktop --quiet --output=json --output-path=docs/perf/home.json
```

## What the first run caught

First pass was **93 / 96** on `/`. Three real causes, all fixed:

1. **Console error** (best practices) — no favicon, so every page logged a 404. Added `src/app/icon.svg`;
   `metadataBase` also removed the Open Graph warning.
2. **200–300 ms of blocking time** — the cart drawer and search dialog (Radix + list) were shipped in
   every page's bundle even though they only matter after a click. They are now `next/dynamic` with
   `ssr: false` and mounted only when opened (`src/components/overlays.tsx`), which also keeps the `/`
   shortcut alive before the dialog exists.
3. **Layout shift risk** — image plates reserve space via fixed aspect ratios; CLS stayed at 0.

No page uses client-side data fetching; everything is server-rendered, so the numbers reflect the
storefront a visitor actually gets.
