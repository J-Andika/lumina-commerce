/**
 * Schema.org Product payload for the PDP. Pure so the shape can be tested
 * without rendering a page.
 */

export type JsonLdVariant = { priceCents: number; stock: number };

export type JsonLdVariantInput = {
  name: string;
  description: string;
  category: string;
  images: string[];
  variants: JsonLdVariant[];
  ratingAvg: number;
  ratingCount: number;
};

export function buildProductJsonLd(input: JsonLdVariantInput) {
  const prices = input.variants.map((variant) => variant.priceCents / 100);
  const inStock = input.variants.some((variant) => variant.stock > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    category: input.category,
    image: input.images,
    brand: { "@type": "Brand", name: "Lumina" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: prices.length > 0 ? Math.min(...prices) : 0,
      highPrice: prices.length > 0 ? Math.max(...prices) : 0,
      offerCount: input.variants.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(input.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(input.ratingAvg.toFixed(1)),
            reviewCount: input.ratingCount,
          },
        }
      : {}),
  };
}
