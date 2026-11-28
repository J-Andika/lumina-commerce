/**
 * Tiny in-memory search over the catalogue index. Not a search engine: it ranks
 * name matches above tagline matches and returns nothing for an empty query.
 */

export type SearchEntry = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  priceCents: number;
  imageUrl?: string;
};

export function filterSearchIndex(entries: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const scored = entries
    .map((entry) => {
      const name = entry.name.toLowerCase();
      const tagline = entry.tagline.toLowerCase();
      const category = entry.category.toLowerCase();

      let score = 0;
      if (name.startsWith(needle)) score = 3;
      else if (name.includes(needle)) score = 2;
      else if (category.includes(needle)) score = 1;
      else if (tagline.includes(needle)) score = 1;

      return { entry, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  return scored.slice(0, limit).map((row) => row.entry);
}
