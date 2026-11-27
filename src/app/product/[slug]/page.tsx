import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product-detail";
import { SiteHeader } from "@/components/site-header";
import { formatMoney } from "@/lib/money";
import { buildProductJsonLd } from "@/lib/product-jsonld";
import { pickDefaultVariant, priceRange } from "@/lib/product-view";
import { getProductBySlug } from "@/server/catalog";

export const dynamic = "force-dynamic";

type Params = { slug: string };

const SPECS: Record<string, Array<{ label: string; value: string }>> = {
  audio: [
    { label: "Warranty", value: "2 years, parts and labour" },
    { label: "In the box", value: "Product, braided cable, travel case" },
    { label: "Service", value: "Replaceable pads and cable" },
  ],
  workspace: [
    { label: "Warranty", value: "5 years on machined parts" },
    { label: "Finish", value: "Anodised aluminium or full-grain leather" },
    { label: "Care", value: "Wipe with a dry cloth; leather ages deliberately" },
  ],
  accessories: [
    { label: "Warranty", value: "1 year on hardware" },
    { label: "Materials", value: "Waxed canvas, brass, braided nylon" },
    { label: "Service", value: "Repair-first, no glued assemblies" },
  ],
};

const SHIPPING = [
  { label: "Standard", value: "$8 — 5 to 7 business days" },
  { label: "Express", value: "$18 — 2 to 3 business days" },
  { label: "Free shipping", value: "Orders $100 and up, after discount" },
];

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: `${product.tagline} — from ${formatMoney(product.minPriceCents)}. ${product.description}`,
    openGraph: {
      title: `${product.name} · Lumina`,
      description: product.tagline,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    priceCents: variant.priceCents,
    stock: variant.stock,
    colorHex: variant.colorHex,
  }));
  const initial = pickDefaultVariant(variants);
  const range = priceRange(variants);
  const totalReviews = product.reviews.length;
  const maxBucket = Math.max(1, ...product.ratingDistribution.map((bucket) => bucket.count));
  const specs = SPECS[product.category] ?? SPECS.accessories;
  const jsonLd = buildProductJsonLd({
    name: product.name,
    description: product.description,
    category: product.category,
    images: product.images.map((image) => image.url),
    variants: product.variants.map((variant) => ({
      priceCents: variant.priceCents,
      stock: variant.stock,
    })),
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[11px] tracking-widest text-muted uppercase">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span aria-hidden> / </span>
          <Link href={`/shop?category=${product.category}`} className="hover:text-foreground">
            {product.category}
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
            {product.category}
            {product.badge ? ` · ${product.badge}` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">{product.tagline}</p>
          {product.ratingCount > 0 ? (
            <p className="mt-2 font-mono text-xs text-muted">
              {product.ratingAvg.toFixed(1)} ★ · {product.ratingCount} reviews
            </p>
          ) : null}
        </div>

        <ProductDetail
          productName={product.name}
          images={product.images.map((image) => ({ id: image.id, url: image.url, alt: image.alt }))}
          variants={variants}
          initialVariantId={initial?.id ?? null}
        />

        <section className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-mono text-[11px] tracking-widest uppercase">About</h2>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{product.description}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              {range
                ? `Range ${formatMoney(range.minCents)}${
                    range.maxCents !== range.minCents ? ` – ${formatMoney(range.maxCents)}` : ""
                  } · ${variants.length} variants`
                : "No variants"}
            </p>
          </div>

          <div className="space-y-3">
            <details open className="border border-hairline">
              <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] tracking-widest uppercase">
                Specifications
              </summary>
              <dl className="space-y-2 px-4 pb-4 text-sm">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between gap-6">
                    <dt className="text-muted">{spec.label}</dt>
                    <dd className="text-right">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </details>

            <details className="border border-hairline">
              <summary className="cursor-pointer px-4 py-3 font-mono text-[11px] tracking-widest uppercase">
                Shipping &amp; returns
              </summary>
              <dl className="space-y-2 px-4 pb-4 text-sm">
                {SHIPPING.map((row) => (
                  <div key={row.label} className="flex justify-between gap-6">
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="text-right">{row.value}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Returns</dt>
                  <dd className="text-right">30 days, unopened</dd>
                </div>
              </dl>
            </details>
          </div>
        </section>

        <section aria-labelledby="reviews-heading" className="mt-14 border-t border-hairline pt-8">
          <h2 id="reviews-heading" className="font-display text-2xl">
            Reviews
          </h2>

          {totalReviews === 0 ? (
            <p className="mt-3 text-sm text-muted">No reviews yet.</p>
          ) : (
            <div className="mt-6 grid gap-10 lg:grid-cols-[280px_1fr]">
              <div>
                <p className="font-mono text-4xl tabular-nums">{product.ratingAvg.toFixed(1)}</p>
                <p className="mt-1 text-xs text-muted">{totalReviews} verified reviews</p>

                <ul className="mt-4 space-y-1" aria-label="Rating distribution">
                  {product.ratingDistribution.map((bucket) => (
                    <li key={bucket.rating} className="flex items-center gap-3 text-xs text-muted">
                      <span className="w-6 font-mono">{bucket.rating}★</span>
                      <span className="h-1.5 flex-1 bg-surface-2">
                        <span
                          className="block h-full bg-accent"
                          style={{ width: `${(bucket.count / maxBucket) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right font-mono">{bucket.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="space-y-6">
                {product.reviews.map((review) => (
                  <li key={review.id} className="border-b border-hairline pb-5 last:border-0">
                    <p className="font-mono text-xs text-muted">
                      {review.rating}/5 · {review.author}
                      {review.verified ? " · verified" : ""}
                    </p>
                    {review.title ? (
                      <p className="mt-1 font-display text-lg">{review.title}</p>
                    ) : null}
                    <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <Link
          href="/shop"
          className="mt-12 inline-block border border-hairline px-4 py-2 font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-foreground"
        >
          ← Back to shop
        </Link>
      </main>
    </div>
  );
}
