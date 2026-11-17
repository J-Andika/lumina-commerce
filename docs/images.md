# Image pipeline

Catalogue imagery is **generated locally**, not photographed. One script draws every plate, so the
set is deterministic, consistent, license-free, and reviewable in a single diff.

## Why generated

Keyword-searched stock photo pools were evaluated first (Openverse, Wikimedia Commons, Unsplash,
Pexels). Two problems killed that path:

1. **Unpredictable subjects.** Search relevance is poor for niche objects; a contact-sheet audit
   found mismatched products and, in one case, imagery that must never ship in a public repo.
2. **Inconsistent look.** Fourteen photos from four sources cannot read as one catalogue without
   heavy treatment, and heavy treatment is a worse lie than honest line art.

Generated plates keep the design system honest: zinc background, one lime accent, serif names,
technical mono labels.

## How it works

`scripts/generate-plates.ts` builds an SVG per product (background gradient, silhouette, name,
category, index) and rasterises it with Sharp.

```bash
npx tsx scripts/generate-plates.ts
```

Per product it writes three variants:

| File | Composition | Purpose |
|---|---|---|
| `01` | Full plate, name + category + index | Catalogue card and gallery lead |
| `02` | 1.75× zoom on the silhouette, no text | Product gallery detail |
| `03` | Rotated 7°, shifted, full text | Product gallery alternate |

## Output

| Asset | Size | Ratio | Formats | Path |
|---|---|---|---|---|
| Product plate | 1200 × 1500 | 4:5 | AVIF q62, WebP q84 | `public/products/<slug>/0{1,2,3}.*` |
| Collection banner | 2000 × 1125 | 16:9 | AVIF q60, WebP q82 | `public/collections/<slug>.*` |

Total payload for 14 products + 3 banners: **under 1 MB** (820 KB products, 76 KB banners).

## `sizes` per breakpoint

```tsx
sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
```

Grid is 3 columns ≥1024px, 2 columns ≥640px, 1 column below. Images are served unoptimised because
they are already AVIF/WebP at the final size — this keeps Sharp out of the runtime container.

## If real photography is added

Keep the same filenames and dimensions so the rest of the app does not change, and:

1. Build a contact sheet and get explicit approval on every frame.
2. Record source, creator, license, and file URL in [`CREDITS.md`](../CREDITS.md).
3. Never commit an unreviewed scraped image, even as a placeholder.
