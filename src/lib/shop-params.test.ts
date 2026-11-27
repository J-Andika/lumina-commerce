import { describe, expect, it } from "vitest";

import {
  activeFilterCount,
  buildShopHref,
  parseShopParams,
  type ShopQuery,
} from "./shop-params";

const base: ShopQuery = { inStock: false, sort: "popular" };

describe("parseShopParams", () => {
  it("returns defaults for an empty query", () => {
    expect(parseShopParams({})).toEqual({ inStock: false, sort: "popular" });
  });

  it("accepts a known category", () => {
    expect(parseShopParams({ category: "audio" }).category).toBe("audio");
  });

  it("drops an unknown category", () => {
    expect(parseShopParams({ category: "garden" }).category).toBeUndefined();
  });

  it("parses wholesale dollar bounds", () => {
    expect(parseShopParams({ min: "50", max: "200" })).toMatchObject({ minPrice: 50, maxPrice: 200 });
  });

  it("swaps inverted bounds", () => {
    expect(parseShopParams({ min: "200", max: "50" })).toMatchObject({ minPrice: 50, maxPrice: 200 });
  });

  it("ignores zero and negative bounds", () => {
    expect(parseShopParams({ min: "0", max: "-5" })).toMatchObject({});
  });

  it("clamps absurd bounds", () => {
    expect(parseShopParams({ max: "999999" }).maxPrice).toBe(10_000);
  });

  it("accepts a 1–5 rating and rejects the rest", () => {
    expect(parseShopParams({ rating: "4" }).minRating).toBe(4);
    expect(parseShopParams({ rating: "9" }).minRating).toBeUndefined();
    expect(parseShopParams({ rating: "abc" }).minRating).toBeUndefined();
  });

  it("reads the stock flag", () => {
    expect(parseShopParams({ stock: "1" }).inStock).toBe(true);
    expect(parseShopParams({ stock: "0" }).inStock).toBe(false);
  });

  it("trims the search term and caps its length", () => {
    expect(parseShopParams({ q: "  desk  " }).q).toBe("desk");
    expect(parseShopParams({ q: "x".repeat(200) }).q).toHaveLength(80);
  });

  it("accepts a known sort and falls back to popular", () => {
    expect(parseShopParams({ sort: "price-desc" }).sort).toBe("price-desc");
    expect(parseShopParams({ sort: "cheapest" }).sort).toBe("popular");
  });

  it("takes the first value when a param repeats", () => {
    expect(parseShopParams({ category: ["audio", "workspace"] }).category).toBe("audio");
  });
});

describe("buildShopHref", () => {
  it("returns the bare path for defaults", () => {
    expect(buildShopHref(base)).toBe("/shop");
  });

  it("serialises every active filter", () => {
    const href = buildShopHref(base, {
      category: "workspace",
      minPrice: 50,
      maxPrice: 200,
      minRating: 4,
      inStock: true,
      q: "desk",
      sort: "rating",
    });

    expect(href).toBe("/shop?category=workspace&min=50&max=200&rating=4&stock=1&q=desk&sort=rating");
  });

  it("drops a filter when the patch clears it", () => {
    const active: ShopQuery = { ...base, category: "audio", inStock: true };

    expect(buildShopHref(active, { category: undefined, inStock: false })).toBe("/shop");
  });

  it("round-trips through the parser", () => {
    const href = buildShopHref(base, { category: "audio", minRating: 5, sort: "price-asc" });
    const parsed = parseShopParams(Object.fromEntries(new URL(href, "https://x").searchParams));

    expect(parsed).toMatchObject({ category: "audio", minRating: 5, sort: "price-asc" });
  });
});

describe("activeFilterCount", () => {
  it("counts nothing for defaults", () => {
    expect(activeFilterCount(base)).toBe(0);
  });

  it("counts a price range once", () => {
    expect(activeFilterCount({ ...base, minPrice: 10, maxPrice: 20 })).toBe(1);
  });

  it("counts every active facet", () => {
    expect(
      activeFilterCount({
        category: "audio",
        minPrice: 10,
        minRating: 4,
        inStock: true,
        q: "desk",
        sort: "rating",
      }),
    ).toBe(6);
  });
});
