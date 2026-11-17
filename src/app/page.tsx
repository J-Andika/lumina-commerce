import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { products } from "@/data/products";
import { formatMoney } from "@/lib/money";

export default function Home() {
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
            Objects for a quieter desk.{" "}
            <span className="text-accent italic">Built to last.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            A headless storefront demo. Filtering, cart, and checkout are wired to a real commerce
            API with server-side pricing — not a mock.
          </p>
        </section>

        <section id="catalog" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <article key={product.slug} className="border border-hairline bg-surface">
                <div className="relative aspect-[4/5] bg-surface-2">
                  <span className="absolute top-3 left-3 font-mono text-[11px] text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="space-y-1 p-4">
                  <h2 className="font-display text-lg">{product.name}</h2>
                  <p className="text-sm text-muted">{product.tagline}</p>
                  <p className="font-mono text-sm tabular-nums">
                    {formatMoney(product.priceCents)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline py-8 text-center text-xs text-muted">
        Stage 1 scaffold — catalog, cart, and checkout land in the next stages.
      </footer>
    </div>
  );
}
