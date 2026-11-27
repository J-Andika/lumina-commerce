import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { formatMoney } from "@/lib/money";
import { getProductBySlug } from "@/server/catalog";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: `${product.tagline} — from ${formatMoney(product.minPriceCents)}`,
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const stock = product.variants.reduce((total, variant) => total + variant.stock, 0);
  const soldOut = stock === 0;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

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

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {product.images.map((image, index) => (
              <div
                key={image.id}
                className={`relative overflow-hidden border border-hairline bg-surface-2 ${
                  index === 0 ? "sm:col-span-2 aspect-[4/5]" : "aspect-square"
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  unoptimized
                  priority={index === 0}
                  sizes={index === 0 ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 27vw, 50vw"}
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
              {product.category}
              {product.badge ? ` · ${product.badge}` : ""}
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-2 text-sm text-muted">{product.tagline}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <p className="font-mono text-2xl tabular-nums">{formatMoney(product.minPriceCents)}</p>
              <span className="font-mono text-xs text-muted">
                {product.ratingCount > 0
                  ? `${product.ratingAvg.toFixed(1)} ★ · ${product.ratingCount} reviews`
                  : "No reviews yet"}
              </span>
            </div>

            <p className="mt-4 font-mono text-xs tracking-widest uppercase">
              {soldOut ? (
                <span className="text-muted">Sold out</span>
              ) : stock <= 3 ? (
                <span className="text-accent">Only {stock} left</span>
              ) : (
                <span className="text-muted">In stock</span>
              )}
            </p>

            <p className="mt-6 max-w-prose text-sm leading-relaxed text-muted">{product.description}</p>

            <div className="mt-8 border-t border-hairline pt-4">
              <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
                Variants and add-to-cart arrive in stage 5
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {product.variants.map((variant) => (
                  <li key={variant.id} className="flex justify-between gap-4 text-muted">
                    <span>{variant.name}</span>
                    <span className="font-mono tabular-nums">
                      {formatMoney(variant.priceCents)}
                      {variant.stock === 0 ? " · sold out" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {product.reviews.length > 0 ? (
              <div className="mt-8 border-t border-hairline pt-4">
                <h2 className="font-mono text-[11px] tracking-widest uppercase">Reviews</h2>
                <ul className="mt-3 space-y-3">
                  {product.reviews.slice(0, 2).map((review) => (
                    <li key={review.id} className="text-sm">
                      <p className="font-mono text-xs text-muted">
                        {review.rating}/5 · {review.author}
                        {review.verified ? " · verified" : ""}
                      </p>
                      <p className="mt-1 text-muted">
                        {review.title ? <strong className="text-foreground">{review.title}. </strong> : null}
                        {review.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <Link
              href="/shop"
              className="mt-8 inline-block border border-hairline px-4 py-2 font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-foreground"
            >
              ← Back to shop
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
