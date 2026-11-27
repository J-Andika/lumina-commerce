import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { getFeaturedProducts, listProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

const COLLECTIONS = [
  { slug: "audio", title: "Audio", copy: "Headphones, DACs, speakers" },
  { slug: "workspace", title: "Workspace", copy: "Desk objects that earn their space" },
  { slug: "accessories", title: "Accessories", copy: "Cables, pouches, adapters" },
] as const;

export default async function Home() {
  const [products, featured] = await Promise.all([
    listProducts({ limit: 14 }),
    getFeaturedProducts(3),
  ]);

  const inStockCount = products.filter((product) =>
    product.variants.some((variant) => variant.stock > 0),
  ).length;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-14 sm:px-6">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
            Curated objects — 2026
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            Objects for a quieter desk. <span className="text-accent italic">Built to last.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            {products.length} objects, {inStockCount} ready to ship. Prices, stock, and ratings come
            from the database — the same rows the checkout will use.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="bg-accent px-5 py-2.5 font-mono text-xs tracking-widest text-accent-foreground uppercase transition-opacity hover:opacity-90"
            >
              Browse all objects
            </Link>
            <Link
              href="/shop?category=workspace"
              className="border border-hairline px-5 py-2.5 font-mono text-xs tracking-widest text-muted uppercase transition-colors hover:text-foreground"
            >
              Workspace edit
            </Link>
          </div>
        </section>

        <section aria-labelledby="collections-heading" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 id="collections-heading" className="sr-only">
            Collections
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.slug}
                href={`/shop?category=${collection.slug}`}
                className="group relative block aspect-[16/9] overflow-hidden border border-hairline bg-surface-2"
              >
                <Image
                  src={`/collections/${collection.slug}.avif`}
                  alt={`${collection.title} collection`}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
                <span className="absolute bottom-3 left-3 font-display text-2xl text-white">
                  {collection.title}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="featured-heading" className="font-display text-2xl">
              Featured
            </h2>
            <Link href="/shop" className="text-sm text-muted transition-colors hover:text-foreground">
              All objects →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} priority={index === 0} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-8 text-center text-xs text-muted">
        Stage 4 — catalog, filters, and product pages from SQLite.
      </footer>
    </div>
  );
}
