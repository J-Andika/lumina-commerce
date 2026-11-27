import Link from "next/link";

import {
  SORT_LABELS,
  SHOP_CATEGORIES,
  SHOP_SORTS,
  activeFilterCount,
  buildShopHref,
  type ShopQuery,
} from "@/lib/shop-params";

type Facets = {
  total: number;
  categories: Array<{ category: string; count: number }>;
};

const CATEGORY_LABELS: Record<string, string> = {
  audio: "Audio",
  workspace: "Workspace",
  accessories: "Accessories",
};

function pillClass(active: boolean) {
  return [
    "px-3 py-1.5 font-mono text-[11px] tracking-widest uppercase transition-colors",
    active
      ? "bg-accent text-accent-foreground"
      : "border border-hairline text-muted hover:text-foreground",
  ].join(" ");
}

export function ShopFilters({ query, facets }: { query: ShopQuery; facets: Facets }) {
  const count = activeFilterCount(query);
  const categoryCount = (category: string) =>
    facets.categories.find((row) => row.category === category)?.count ?? 0;

  return (
    <div className="space-y-4 border-y border-hairline py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={buildShopHref(query, { category: undefined })} className={pillClass(!query.category)}>
          All <span className="ml-1 opacity-60">{facets.total}</span>
        </Link>
        {SHOP_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={buildShopHref(query, { category })}
            className={pillClass(query.category === category)}
          >
            {CATEGORY_LABELS[category]}{" "}
            <span className="ml-1 opacity-60">{categoryCount(category)}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <form action="/shop" method="get" className="flex items-end gap-2">
          {query.category ? <input type="hidden" name="category" value={query.category} /> : null}
          {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
          {query.minRating ? <input type="hidden" name="rating" value={query.minRating} /> : null}
          {query.inStock ? <input type="hidden" name="stock" value="1" /> : null}
          {query.sort !== "popular" ? <input type="hidden" name="sort" value={query.sort} /> : null}

          <label className="font-mono text-[10px] tracking-widest text-muted uppercase">
            Min $
            <input
              type="number"
              name="min"
              min={0}
              max={10000}
              defaultValue={query.minPrice ?? ""}
              className="mt-1 block h-8 w-20 border border-hairline bg-surface px-2 text-sm text-foreground"
            />
          </label>
          <label className="font-mono text-[10px] tracking-widest text-muted uppercase">
            Max $
            <input
              type="number"
              name="max"
              min={0}
              max={10000}
              defaultValue={query.maxPrice ?? ""}
              className="mt-1 block h-8 w-20 border border-hairline bg-surface px-2 text-sm text-foreground"
            />
          </label>
          <button
            type="submit"
            className="h-8 border border-hairline px-3 font-mono text-[11px] tracking-widest text-muted uppercase transition-colors hover:text-foreground"
          >
            Apply
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">Rating</span>
          {[4, 5].map((rating) => (
            <Link
              key={rating}
              href={buildShopHref(query, {
                minRating: query.minRating === rating ? undefined : rating,
              })}
              className={pillClass(query.minRating === rating)}
            >
              {rating}★+
            </Link>
          ))}
          <Link
            href={buildShopHref(query, { inStock: !query.inStock })}
            className={pillClass(query.inStock)}
          >
            In stock
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">Sort</span>
          {SHOP_SORTS.map((sort) => (
            <Link
              key={sort}
              href={buildShopHref(query, { sort })}
              className={pillClass(query.sort === sort)}
            >
              {SORT_LABELS[sort]}
            </Link>
          ))}
        </div>
      </div>

      {count > 0 ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {count} active
          </span>
          <Link href="/shop" className="font-mono text-[11px] tracking-widest text-accent uppercase hover:underline">
            Clear all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
