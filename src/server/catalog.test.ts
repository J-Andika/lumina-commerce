import { describe, expect, it } from "vitest";
import { getFacets, getFeaturedProducts, getProductBySlug, listProducts } from "./catalog";

describe("listProducts", () => {
  it("returns the seeded catalog", async () => {
    const products = await listProducts({ limit: 100 });
    expect(products).toHaveLength(14);
    expect(products[0]).toHaveProperty("minPriceCents");
  });

  it("filters by category", async () => {
    const products = await listProducts({ category: "audio", limit: 100 });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.category === "audio")).toBe(true);
  });

  it("respects the minimum price bound", async () => {
    const products = await listProducts({ minPriceCents: 15000, limit: 100 });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.minPriceCents >= 15000)).toBe(true);
  });

  it("respects the maximum price bound", async () => {
    const products = await listProducts({ maxPriceCents: 9000, limit: 100 });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.minPriceCents <= 9000)).toBe(true);
  });

  it("applies a price range", async () => {
    const products = await listProducts({ minPriceCents: 6000, maxPriceCents: 15000, limit: 100 });
    expect(products.length).toBeGreaterThan(0);
    expect(
      products.every(
        (product) => product.minPriceCents >= 6000 && product.minPriceCents <= 15000,
      ),
    ).toBe(true);
  });

  it("filters by minimum rating", async () => {
    const products = await listProducts({ minRating: 5, limit: 100 });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.ratingAvg >= 5)).toBe(true);
  });

  it("excludes fully sold-out products when inStock is set", async () => {
    const all = await listProducts({ limit: 100 });
    const inStock = await listProducts({ inStock: true, limit: 100 });
    expect(inStock.length).toBe(all.length - 1);
    expect(inStock.some((product) => product.slug === "orbit")).toBe(false);
  });

  it("sorts by price ascending", async () => {
    const products = await listProducts({ sort: "price-asc", limit: 100 });
    const prices = products.map((product) => product.minPriceCents);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("sorts by price descending", async () => {
    const products = await listProducts({ sort: "price-desc", limit: 100 });
    const prices = products.map((product) => product.minPriceCents);
    expect([...prices].sort((a, b) => b - a)).toEqual(prices);
  });

  it("sorts by rating", async () => {
    const products = await listProducts({ sort: "rating", limit: 100 });
    const ratings = products.map((product) => product.ratingAvg);
    expect([...ratings].sort((a, b) => b - a)).toEqual(ratings);
  });

  it("searches by name", async () => {
    const products = await listProducts({ q: "monolith", limit: 100 });
    expect(products).toHaveLength(1);
    expect(products[0]?.slug).toBe("monolith");
  });

  it("searches taglines and descriptions", async () => {
    const products = await listProducts({ q: "headphones", limit: 100 });
    const slugs = products.map((product) => product.slug);
    expect(slugs).toContain("monolith");
    expect(slugs).toContain("drift");
  });

  it("returns an empty array for an impossible range", async () => {
    const products = await listProducts({ minPriceCents: 10_000_00, limit: 100 });
    expect(products).toEqual([]);
  });

  it("caps results with limit", async () => {
    const products = await listProducts({ limit: 3 });
    expect(products).toHaveLength(3);
  });
});

describe("getProductBySlug", () => {
  it("returns variants, images, reviews, and a rating distribution", async () => {
    const product = await getProductBySlug("monolith");
    expect(product).not.toBeNull();
    expect(product?.variants).toHaveLength(5);
    expect(product?.images).toHaveLength(3);
    expect(product?.reviews.length).toBeGreaterThanOrEqual(4);
    expect(product?.ratingDistribution).toHaveLength(5);
    expect(
      product?.ratingDistribution.reduce((total, bucket) => total + bucket.count, 0),
    ).toBe(product?.reviews.length);
  });

  it("returns the cheapest variant first", async () => {
    const product = await getProductBySlug("quill");
    const prices = product?.variants.map((variant) => variant.priceCents) ?? [];
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("returns null for an unknown slug", async () => {
    expect(await getProductBySlug("does-not-exist")).toBeNull();
  });
});

describe("getFeaturedProducts", () => {
  it("returns only featured products", async () => {
    const products = await getFeaturedProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((product) => product.featured)).toBe(true);
  });
});

describe("getFacets", () => {
  it("counts every category and reports price bounds", async () => {
    const facets = await getFacets();
    expect(facets.total).toBe(14);
    expect(facets.categories.reduce((total, row) => total + row.count, 0)).toBe(14);
    expect(facets.minPriceCents).toBeGreaterThan(0);
    expect(facets.maxPriceCents).toBeGreaterThanOrEqual(facets.minPriceCents);
  });
});
