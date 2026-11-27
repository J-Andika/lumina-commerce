import { describe, expect, it } from "vitest";

import { buildProductJsonLd } from "./product-jsonld";

const input = {
  name: "Monolith",
  description: "Closed-back reference headphones.",
  category: "audio",
  images: ["/products/monolith/01.avif"],
  variants: [
    { priceCents: 34900, stock: 12 },
    { priceCents: 39900, stock: 0 },
  ],
  ratingAvg: 4.75,
  ratingCount: 4,
};

describe("buildProductJsonLd", () => {
  it("declares a Product with the Lumina brand", () => {
    const jsonLd = buildProductJsonLd(input);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.brand).toEqual({ "@type": "Brand", name: "Lumina" });
  });

  it("reports the price range in dollars", () => {
    const jsonLd = buildProductJsonLd(input);

    expect(jsonLd.offers.lowPrice).toBe(349);
    expect(jsonLd.offers.highPrice).toBe(399);
    expect(jsonLd.offers.priceCurrency).toBe("USD");
    expect(jsonLd.offers.offerCount).toBe(2);
  });

  it("marks a product in stock when any variant has stock", () => {
    expect(buildProductJsonLd(input).offers.availability).toBe("https://schema.org/InStock");
  });

  it("marks a sold-out product", () => {
    const soldOut = buildProductJsonLd({
      ...input,
      variants: [{ priceCents: 5900, stock: 0 }],
    });

    expect(soldOut.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("includes aggregateRating when reviews exist", () => {
    const jsonLd = buildProductJsonLd(input) as { aggregateRating?: { ratingValue: number; reviewCount: number } };

    expect(jsonLd.aggregateRating).toEqual({ "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 4 });
  });

  it("omits aggregateRating without reviews", () => {
    const jsonLd = buildProductJsonLd({ ...input, ratingAvg: 0, ratingCount: 0 }) as {
      aggregateRating?: unknown;
    };

    expect(jsonLd.aggregateRating).toBeUndefined();
  });

  it("passes images through", () => {
    expect(buildProductJsonLd(input).image).toEqual(input.images);
  });

  it("handles a product without variants", () => {
    const jsonLd = buildProductJsonLd({ ...input, variants: [] });

    expect(jsonLd.offers.lowPrice).toBe(0);
    expect(jsonLd.offers.highPrice).toBe(0);
    expect(jsonLd.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});
