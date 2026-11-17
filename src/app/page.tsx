import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { formatMoney } from "@/lib/money";
import { listProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listProducts({ limit: 14 });
  const inStockCount = products.filter((product) =>
    product.variants.some((variant) => variant.stock > 0),
  ).length;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="font-display text-xl tracking-tight">
            Lumina
          </Link>
          <nav className="hidden gap-5 text-sm text-muted sm:flex" aria-label="Categories">
            <a className="transition-colors hover:text-foreground" href="#catalog">
              Audio
            </a>
            <a className="transition-colors hover:text-foreground" href="#catalog">
              Workspace
            </a>
            <a className="transition-colors hover:text-foreground" href="#catalog">
              Accessories
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-6">
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
        </section>

        <section id="catalog" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => {
              const stock = product.variants.reduce((total, variant) => total + variant.stock, 0);
              const soldOut = stock === 0;
              const cover = product.images[0];

              return (
                <article key={product.slug} className="group border border-hairline bg-surface">
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={cover.alt}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className={`object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
                          soldOut ? "opacity-60 grayscale" : ""
                        }`}
                        priority={index < 3}
                      />
                    ) : null}
                    <span className="absolute top-3 left-3 font-mono text-[11px] text-white/80 mix-blend-difference">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {soldOut ? (
                      <span className="absolute top-3 right-3 border border-hairline bg-background/90 px-2 py-0.5 font-mono text-[10px] tracking-widest text-muted uppercase">
                        Sold out
                      </span>
                    ) : product.badge ? (
                      <span className="absolute top-3 right-3 bg-accent px-2 py-0.5 font-mono text-[10px] tracking-widest text-accent-foreground uppercase">
                        {product.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="font-display text-lg">{product.name}</h2>
                      <span className="font-mono text-xs text-muted">
                        {product.ratingCount > 0
                          ? `${product.ratingAvg.toFixed(1)} ★ (${product.ratingCount})`
                          : "No reviews"}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{product.tagline}</p>
                    <p className="font-mono text-sm tabular-nums">
                      from {formatMoney(product.minPriceCents)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-8 text-center text-xs text-muted">
        Stage 2 — catalog served from SQLite through a server-only query layer.
      </footer>
    </div>
  );
}
