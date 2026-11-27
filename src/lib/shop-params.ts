/**
 * URL-state for the catalogue. Everything the filter bar does is a plain GET
 * parameter, so views are shareable, back/forward works, and the page renders
 * without JavaScript.
 */

export const SHOP_CATEGORIES = ["audio", "workspace", "accessories"] as const;
export type ShopCategory = (typeof SHOP_CATEGORIES)[number];

export const SHOP_SORTS = ["popular", "price-asc", "price-desc", "rating"] as const;
export type ShopSort = (typeof SHOP_SORTS)[number];

export const SORT_LABELS: Record<ShopSort, string> = {
  popular: "Most popular",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Top rated",
};

const MAX_PRICE_DOLLARS = 10_000;

export type ShopQuery = {
  category?: ShopCategory;
  /** Whole dollars, as typed into the form. */
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock: boolean;
  q?: string;
  sort: ShopSort;
};

export const DEFAULT_SHOP_QUERY: ShopQuery = { inStock: false, sort: "popular" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseMoney(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;

  return Math.min(Math.round(parsed), MAX_PRICE_DOLLARS);
}

export function parseShopParams(
  searchParams: Record<string, string | string[] | undefined>,
): ShopQuery {
  const rawCategory = firstValue(searchParams.category);
  const category = SHOP_CATEGORIES.includes(rawCategory as ShopCategory)
    ? (rawCategory as ShopCategory)
    : undefined;

  const rawSort = firstValue(searchParams.sort);
  const sort = SHOP_SORTS.includes(rawSort as ShopSort) ? (rawSort as ShopSort) : "popular";

  const rawRating = Number(firstValue(searchParams.rating));
  const minRating = Number.isFinite(rawRating) && rawRating >= 1 && rawRating <= 5
    ? Math.round(rawRating)
    : undefined;

  let minPrice = parseMoney(firstValue(searchParams.min));
  let maxPrice = parseMoney(firstValue(searchParams.max));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const q = firstValue(searchParams.q)?.trim().slice(0, 80) || undefined;

  return {
    category,
    minPrice,
    maxPrice,
    minRating,
    inStock: firstValue(searchParams.stock) === "1",
    q,
    sort,
  };
}

export function buildShopHref(query: ShopQuery, patch: Partial<ShopQuery> = {}): string {
  const next: ShopQuery = { ...query, ...patch };
  const params = new URLSearchParams();

  if (next.category) params.set("category", next.category);
  if (typeof next.minPrice === "number") params.set("min", String(next.minPrice));
  if (typeof next.maxPrice === "number") params.set("max", String(next.maxPrice));
  if (typeof next.minRating === "number") params.set("rating", String(next.minRating));
  if (next.inStock) params.set("stock", "1");
  if (next.q) params.set("q", next.q);
  if (next.sort !== "popular") params.set("sort", next.sort);

  const search = params.toString();

  return search ? `/shop?${search}` : "/shop";
}

export function activeFilterCount(query: ShopQuery): number {
  let count = 0;
  if (query.category) count += 1;
  if (typeof query.minPrice === "number" || typeof query.maxPrice === "number") count += 1;
  if (typeof query.minRating === "number") count += 1;
  if (query.inStock) count += 1;
  if (query.q) count += 1;
  if (query.sort !== "popular") count += 1;

  return count;
}
