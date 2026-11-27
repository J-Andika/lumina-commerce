import { describe, expect, it } from "vitest";

import { pickDefaultVariant, priceRange, stockLabel, type VariantView } from "./product-view";

const variant = (overrides: Partial<VariantView> = {}): VariantView => ({
  id: "v1",
  name: "Obsidian",
  priceCents: 34900,
  stock: 5,
  ...overrides,
});

describe("pickDefaultVariant", () => {
  it("returns the cheapest in-stock variant", () => {
    const picked = pickDefaultVariant([
      variant({ id: "a", priceCents: 39900 }),
      variant({ id: "b", priceCents: 34900 }),
      variant({ id: "c", priceCents: 32900, stock: 0 }),
    ]);

    expect(picked?.id).toBe("b");
  });

  it("falls back to the cheapest variant when everything is sold out", () => {
    const picked = pickDefaultVariant([
      variant({ id: "a", priceCents: 39900, stock: 0 }),
      variant({ id: "b", priceCents: 34900, stock: 0 }),
    ]);

    expect(picked?.id).toBe("b");
  });

  it("returns null for an empty list", () => {
    expect(pickDefaultVariant([])).toBeNull();
  });
});

describe("stockLabel", () => {
  it("reports sold out", () => {
    expect(stockLabel(0)).toEqual({ text: "Sold out", tone: "muted" });
  });

  it("flags low stock", () => {
    expect(stockLabel(2)).toEqual({ text: "Only 2 left", tone: "accent" });
  });

  it("reports healthy stock", () => {
    expect(stockLabel(12)).toEqual({ text: "In stock", tone: "muted" });
  });
});

describe("priceRange", () => {
  it("returns the min and max", () => {
    expect(priceRange([variant({ priceCents: 100 }), variant({ priceCents: 300 })])).toEqual({
      minCents: 100,
      maxCents: 300,
    });
  });

  it("returns a single price as both bounds", () => {
    expect(priceRange([variant({ priceCents: 100 })])).toEqual({ minCents: 100, maxCents: 100 });
  });

  it("returns null for no variants", () => {
    expect(priceRange([])).toBeNull();
  });
});
