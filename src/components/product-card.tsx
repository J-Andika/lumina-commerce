import Image from "next/image";
import Link from "next/link";

import { formatMoney } from "@/lib/money";
import type { CatalogProduct } from "@/server/catalog";

type Props = {
  product: CatalogProduct;
  index?: number;
  priority?: boolean;
};

export function ProductCard({ product, index, priority = false }: Props) {
  const stock = product.variants.reduce((total, variant) => total + variant.stock, 0);
  const soldOut = stock === 0;
  const cover = product.images[0];

  return (
    <article className="group border border-hairline bg-surface">
      <Link href={`/product/${product.slug}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              unoptimized
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className={`object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
                soldOut ? "opacity-60 grayscale" : ""
              }`}
            />
          ) : null}

          {typeof index === "number" ? (
            <span className="absolute top-3 left-3 font-mono text-[11px] text-white/80 mix-blend-difference">
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}

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
          <p className="font-mono text-sm tabular-nums">from {formatMoney(product.minPriceCents)}</p>
        </div>
      </Link>
    </article>
  );
}
