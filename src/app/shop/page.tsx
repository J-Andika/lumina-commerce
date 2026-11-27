import Link from "next/link";

import { ProductCard } from "@/components/product-card";
import { ShopFilters } from "@/components/shop-filters";
import { SiteHeader } from "@/components/site-header";
import { parseShopParams } from "@/lib/shop-params";
import { getFacets, listProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description: "Audio, workspace, and accessory objects — filtered and sorted.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = parseShopParams(await searchParams);

  const [products, facets] = await Promise.all([
    listProducts({
      category: query.category,
      minPriceCents: query.minPrice ? query.minPrice * 100 : undefined,
      maxPriceCents: query.maxPrice ? query.maxPrice * 100 : undefined,
      minRating: query.minRating,
      inStock: query.inStock,
      q: query.q,
      sort: query.sort,
      limit: 48,
    }),
    getFacets(),
  ]);

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-widest text-muted uppercase">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">Shop</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">All objects</h1>
          <p className="font-mono text-xs text-muted" aria-live="polite">
            {products.length} {products.length === 1 ? "result" : "results"}
            {query.q ? ` for “${query.q}”` : ""}
          </p>
        </div>

        <div className="mt-6">
          <ShopFilters query={query} facets={facets} />
        </div>

        {products.length === 0 ? (
          <div className="border border-hairline bg-surface p-10 text-center">
            <p className="font-display text-2xl">Nothing matches those filters.</p>
            <p className="mt-2 text-sm text-muted">
              Try widening the price range or removing the rating filter.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block bg-accent px-4 py-2 font-mono text-[11px] tracking-widest text-accent-foreground uppercase"
            >
              Reset filters
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-hairline py-8 text-center text-xs text-muted">
        Filters live in the URL — copy the address bar to share this view.
      </footer>
    </div>
  );
}
