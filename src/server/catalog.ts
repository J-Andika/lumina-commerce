import { db } from "./db";
import type { Category } from "./types";

export const SORT_KEYS = ["popular", "price-asc", "price-desc", "rating"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type CatalogFilters = {
  category?: Category;
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
  inStock?: boolean;
  q?: string;
  sort?: SortKey;
  limit?: number;
};

const CARD_INCLUDE = {
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: { orderBy: { priceCents: "asc" }, select: { priceCents: true, stock: true } },
} as const;

export type CatalogProduct = Awaited<ReturnType<typeof listProducts>>[number];

export async function listProducts(filters: CatalogFilters = {}) {
  const {
    category,
    minPriceCents,
    maxPriceCents,
    minRating,
    inStock,
    q,
    sort = "popular",
    limit = 24,
  } = filters;

  const price: { gte?: number; lte?: number } = {};
  if (typeof minPriceCents === "number") price.gte = minPriceCents;
  if (typeof maxPriceCents === "number") price.lte = maxPriceCents;

  const search = q?.trim();

  return db.product.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(Object.keys(price).length > 0 ? { minPriceCents: price } : {}),
      ...(typeof minRating === "number" ? { ratingAvg: { gte: minRating } } : {}),
      ...(inStock ? { variants: { some: { stock: { gt: 0 } } } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { tagline: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy:
      sort === "price-asc"
        ? [{ minPriceCents: "asc" }, { name: "asc" }]
        : sort === "price-desc"
          ? [{ minPriceCents: "desc" }, { name: "asc" }]
          : sort === "rating"
            ? [{ ratingAvg: "desc" }, { ratingCount: "desc" }]
            : [{ ratingCount: "desc" }, { ratingAvg: "desc" }, { createdAt: "desc" }],
    include: CARD_INCLUDE,
    take: limit,
  });
}

export async function getProductBySlug(slug: string) {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ priceCents: "asc" }, { name: "asc" }] },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) return null;

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: product.reviews.filter((review) => review.rating === rating).length,
  }));

  return { ...product, ratingDistribution: distribution };
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getFeaturedProducts(limit = 3) {
  return db.product.findMany({
    where: { featured: true },
    orderBy: [{ ratingCount: "desc" }, { name: "asc" }],
    include: CARD_INCLUDE,
    take: limit,
  });
}

export async function getFacets() {
  const [grouped, bounds, total] = await Promise.all([
    db.product.groupBy({ by: ["category"], _count: { _all: true } }),
    db.product.aggregate({ _min: { minPriceCents: true }, _max: { minPriceCents: true } }),
    db.product.count(),
  ]);

  const categories = grouped
    .map((row) => ({ category: row.category as Category, count: row._count._all }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return {
    total,
    categories,
    minPriceCents: bounds._min.minPriceCents ?? 0,
    maxPriceCents: bounds._max.minPriceCents ?? 0,
  };
}
