import { describe, expect, it } from "vitest";

import { filterSearchIndex, type SearchEntry } from "./search";

const entries: SearchEntry[] = [
  { slug: "monolith", name: "Monolith", tagline: "Closed-back headphones", category: "audio", priceCents: 34900 },
  { slug: "drift", name: "Drift", tagline: "Open-back headphones", category: "audio", priceCents: 27900 },
  { slug: "quill", name: "Quill", tagline: "65% mechanical keyboard", category: "workspace", priceCents: 19900 },
  { slug: "tether", name: "Tether", tagline: "Braided USB-C cable", category: "accessories", priceCents: 3900 },
];

describe("filterSearchIndex", () => {
  it("returns nothing for an empty query", () => {
    expect(filterSearchIndex(entries, "   ")).toEqual([]);
  });

  it("matches a name prefix first", () => {
    expect(filterSearchIndex(entries, "mon")[0]?.slug).toBe("monolith");
  });

  it("matches a tagline term", () => {
    const results = filterSearchIndex(entries, "headphones");
    expect(results.map((entry) => entry.slug).sort()).toEqual(["drift", "monolith"]);
  });

  it("matches a category", () => {
    const results = filterSearchIndex(entries, "workspace");
    expect(results.map((entry) => entry.slug)).toEqual(["quill"]);
  });

  it("is case-insensitive", () => {
    expect(filterSearchIndex(entries, "QUILL")).toHaveLength(1);
  });

  it("respects the limit", () => {
    expect(filterSearchIndex(entries, "e", 2)).toHaveLength(2);
  });

  it("returns nothing when nothing matches", () => {
    expect(filterSearchIndex(entries, "zzz")).toEqual([]);
  });
});
