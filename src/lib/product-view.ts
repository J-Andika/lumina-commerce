/**
 * Small pure helpers for the product page. Keeping the selection and labelling
 * rules out of the client component makes them testable without a DOM.
 */

export type VariantView = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
  colorHex?: string | null;
};

export function pickDefaultVariant(variants: VariantView[]): VariantView | null {
  if (variants.length === 0) return null;

  const inStock = variants.filter((variant) => variant.stock > 0);
  const pool = inStock.length > 0 ? inStock : variants;

  return pool.reduce((cheapest, variant) =>
    variant.priceCents < cheapest.priceCents ? variant : cheapest,
  );
}

export function stockLabel(stock: number): { text: string; tone: "muted" | "accent" } {
  if (stock <= 0) return { text: "Sold out", tone: "muted" };
  if (stock <= 3) return { text: `Only ${stock} left`, tone: "accent" };

  return { text: "In stock", tone: "muted" };
}

export function priceRange(variants: VariantView[]): { minCents: number; maxCents: number } | null {
  if (variants.length === 0) return null;

  const prices = variants.map((variant) => variant.priceCents);

  return { minCents: Math.min(...prices), maxCents: Math.max(...prices) };
}
