# Asset credits

## Catalogue imagery

Every product image and collection banner in `public/` is **generated artwork**, produced by
[`scripts/generate-plates.ts`](./scripts/generate-plates.ts): monochrome line-art plates drawn as
SVG and rasterised with Sharp to AVIF and WebP. There is no third-party photography in this
repository, so there is nothing to attribute and nothing to license.

Generating the plates was a deliberate decision after auditing stock-photo pipelines:

- keyword-searched photo pools return unpredictable subjects, and one audit run returned imagery
  that is unacceptable in a public portfolio repository;
- mixed sources cannot hold a consistent look across a 14-product catalogue;
- scraped assets need per-file license bookkeeping forever, while generated plates need none.

If curated photography is added later, each file must be reviewed before it lands (contact sheet +
explicit approval) and its source, creator, and license recorded in this file.

## Fonts

Inter and Instrument Serif are loaded through `next/font/google`, which self-hosts the files at
build time. Both are licensed under the SIL Open Font License 1.1.

## Icons

Lucide icons (ISC License) via `lucide-react`.
