export type Category = "audio" | "workspace" | "accessories";

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  category: Category;
  priceCents: number;
};

/**
 * Placeholder catalog for the stage-1 shell.
 * Replaced by the Prisma-backed catalog in stage 2.
 */
export const products: Product[] = [
  {
    slug: "monolith-headphones",
    name: "Monolith",
    tagline: "Closed-back reference headphones",
    category: "audio",
    priceCents: 34900,
  },
  {
    slug: "slate-desk-mat",
    name: "Slate",
    tagline: "Full-grain leather desk mat",
    category: "workspace",
    priceCents: 12900,
  },
  {
    slug: "carry-01",
    name: "Carry 01",
    tagline: "Waxed canvas daily pouch",
    category: "accessories",
    priceCents: 8900,
  },
];
