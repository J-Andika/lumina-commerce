import "dotenv/config";

import { db } from "../src/server/db";

type VariantSeed = { name: string; sku: string; priceCents: number; stock: number; colorHex?: string };
type ReviewSeed = { author: string; rating: number; title?: string; body: string; verified?: boolean };
type ProductSeed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: "audio" | "workspace" | "accessories";
  badge?: string;
  featured?: boolean;
  variants: VariantSeed[];
  reviews: ReviewSeed[];
};

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 1500;

const products: ProductSeed[] = [
  {
    slug: "monolith",
    name: "Monolith",
    tagline: "Closed-back reference headphones",
    description:
      "A closed-back reference headphone tuned for long sessions: flat mids, controlled sub-bass, and pads that stay comfortable past hour three. Ships with a hard case and two cables.",
    category: "audio",
    badge: "New",
    featured: true,
    variants: [
      { name: "Obsidian", sku: "MON-OBS", priceCents: 34900, stock: 12, colorHex: "#111113" },
      { name: "Bone", sku: "MON-BON", priceCents: 34900, stock: 3, colorHex: "#e7e2d8" },
      { name: "Graphite", sku: "MON-GRA", priceCents: 34900, stock: 0, colorHex: "#3f3f46" },
      { name: "Obsidian + Case", sku: "MON-OBS-CASE", priceCents: 39900, stock: 4, colorHex: "#111113" },
      { name: "Bone + Case", sku: "MON-BON-CASE", priceCents: 39900, stock: 2, colorHex: "#e7e2d8" },
    ],
    reviews: [
      { author: "Rafi P.", rating: 5, title: "Reference without the fatigue", body: "Mids are honest and the clamp force is right. I mix on these for four hours and forget I am wearing them." },
      { author: "Dana K.", rating: 5, body: "Isolation is good enough for a shared office. The case is worth the upgrade." },
      { author: "Miko S.", rating: 4, title: "Great, slightly heavy", body: "Sound is exactly what I wanted. The headband takes a week to break in." },
      { author: "Lena W.", rating: 5, body: "Second pair. First one survived three years of touring." },
    ],
  },
  {
    slug: "drift",
    name: "Drift",
    tagline: "Open-back studio headphones",
    description:
      "Open-back headphones for tracking and mixing in a quiet room. Wide stage, low weight, replaceable pads, and a detachable cable that does not cost a fortune to replace.",
    category: "audio",
    variants: [
      { name: "Black", sku: "DRF-BLK", priceCents: 27900, stock: 8, colorHex: "#18181b" },
      { name: "Ash", sku: "DRF-ASH", priceCents: 27900, stock: 0, colorHex: "#a1a1aa" },
      { name: "Tan", sku: "DRF-TAN", priceCents: 29900, stock: 2, colorHex: "#c8a27a" },
      { name: "Ash + Case", sku: "DRF-ASH-CASE", priceCents: 31900, stock: 3, colorHex: "#a1a1aa" },
    ],
    reviews: [
      { author: "Bram H.", rating: 5, title: "Stage for days", body: "Best open-back under $300 I have tried. Pads are easy to swap." },
      { author: "Sinta R.", rating: 4, body: "Lovely detail. Not for loud rooms, which is the point." },
      { author: "Owen T.", rating: 3, title: "Clamp needs breaking in", body: "Sound is good after EQ, but the first week was tight." },
    ],
  },
  {
    slug: "ember",
    name: "Ember",
    tagline: "Portable DAC and headphone amp",
    description:
      "A pocket DAC that drives planar headphones without hissing. USB-C in, 3.5 mm and 4.4 mm balanced out, and a volume wheel that does not jump.",
    category: "audio",
    variants: [
      { name: "Anodised Black", sku: "EMB-BLK", priceCents: 18900, stock: 22, colorHex: "#111113" },
      { name: "Silver", sku: "EMB-SLV", priceCents: 18900, stock: 14, colorHex: "#d4d4d8" },
      { name: "Graphite", sku: "EMB-GRA", priceCents: 18900, stock: 0, colorHex: "#3f3f46" },
    ],
    reviews: [
      { author: "Yoga A.", rating: 5, title: "No hiss on sensitive IEMs", body: "Silent background, and the wheel has real steps." },
      { author: "Clara M.", rating: 4, body: "Drives my planars at 60 percent. Gets warm, not hot." },
    ],
  },
  {
    slug: "halo",
    name: "Halo",
    tagline: "Wireless earbuds with adaptive ANC",
    description:
      "Small-shell earbuds with adaptive noise cancelling, multipoint pairing, and a case that charges over USB-C or wirelessly. Eight hours per charge, thirty with the case.",
    category: "audio",
    badge: "Best seller",
    featured: true,
    variants: [
      { name: "Graphite", sku: "HAL-GRA", priceCents: 14900, stock: 30, colorHex: "#27272a" },
      { name: "Ivory", sku: "HAL-IVO", priceCents: 14900, stock: 18, colorHex: "#f4f4f5" },
      { name: "Moss", sku: "HAL-MOS", priceCents: 14900, stock: 0, colorHex: "#4d7c0f" },
      { name: "Sand", sku: "HAL-SND", priceCents: 14900, stock: 7, colorHex: "#d6c7b0" },
    ],
    reviews: [
      { author: "Putri N.", rating: 5, title: "Multipoint just works", body: "Laptop and phone at the same time, no re-pairing dance." },
      { author: "Arif D.", rating: 4, body: "ANC is good on trains. Transparency is a little bright." },
      { author: "Nadia F.", rating: 5, body: "Fits my ears without the wing tips, which never happens." },
    ],
  },
  {
    slug: "cadence",
    name: "Cadence",
    tagline: "Two-way desktop speakers",
    description:
      "Two-way nearfield speakers with a rear port and a front volume dial. Meant for a desk, not a living room: tight bass at low volume and no hiss at idle.",
    category: "audio",
    variants: [
      { name: "Walnut", sku: "CAD-WAL", priceCents: 22900, stock: 6, colorHex: "#7c5a3c" },
      { name: "Black", sku: "CAD-BLK", priceCents: 22900, stock: 9, colorHex: "#18181b" },
      { name: "White", sku: "CAD-WHT", priceCents: 22900, stock: 3, colorHex: "#f4f4f5" },
    ],
    reviews: [
      { author: "Hendra S.", rating: 5, title: "Built for a desk", body: "No subwoofer needed at arm's length. Dial has a nice detent." },
      { author: "Maya L.", rating: 4, body: "Warm and clear. Rear port means you need some wall distance." },
    ],
  },
  {
    slug: "slate",
    name: "Slate",
    tagline: "Full-grain leather desk mat",
    description:
      "A full-grain leather mat that develops a patina instead of peeling. Felt backing, stitched edge, and a size for a laptop-only desk or a full monitor setup.",
    category: "workspace",
    featured: true,
    variants: [
      { name: "Medium / Black", sku: "SLT-M-BLK", priceCents: 12900, stock: 15, colorHex: "#18181b" },
      { name: "Large / Black", sku: "SLT-L-BLK", priceCents: 15900, stock: 4, colorHex: "#18181b" },
      { name: "Medium / Oxblood", sku: "SLT-M-OXB", priceCents: 12900, stock: 0, colorHex: "#6b1f1f" },
      { name: "X-Large / Black", sku: "SLT-XL-BLK", priceCents: 18900, stock: 1, colorHex: "#18181b" },
    ],
    reviews: [
      { author: "Kevin J.", rating: 5, title: "Smells like a workshop", body: "Two months in and the edges have darkened nicely." },
      { author: "Ratna S.", rating: 5, body: "Does not slide. Mouse tracking is fine without a pad on top." },
      { author: "Dimas W.", rating: 4, body: "Wish the large were a touch wider for two monitors." },
    ],
  },
  {
    slug: "axis",
    name: "Axis",
    tagline: "Machined aluminium monitor riser",
    description:
      "A single-piece aluminium riser that lifts a monitor to eye level and leaves 42 mm of storage underneath. Rubber feet, cable channel, no wobble.",
    category: "workspace",
    variants: [
      { name: "Silver", sku: "AXS-SLV", priceCents: 15900, stock: 7, colorHex: "#d4d4d8" },
      { name: "Space Grey", sku: "AXS-SPG", priceCents: 15900, stock: 1, colorHex: "#52525b" },
      { name: "Black", sku: "AXS-BLK", priceCents: 15900, stock: 12, colorHex: "#18181b" },
    ],
    reviews: [
      { author: "Fajar R.", rating: 5, body: "Holds a 27-inch display without a hint of flex." },
      { author: "Ella V.", rating: 4, title: "Solid, heavy", body: "Exactly what I wanted, just be ready for the weight." },
    ],
  },
  {
    slug: "quill",
    name: "Quill",
    tagline: "65% mechanical keyboard",
    description:
      "A 65% board with a gasket mount, PBT keycaps, and hot-swap sockets. Four switch options, one of which is quiet enough for an open office.",
    category: "workspace",
    badge: "Restocked",
    variants: [
      { name: "Linear", sku: "QLL-LIN", priceCents: 19900, stock: 11, colorHex: "#27272a" },
      { name: "Tactile", sku: "QLL-TAC", priceCents: 19900, stock: 2, colorHex: "#3f3f46" },
      { name: "Clicky", sku: "QLL-CLK", priceCents: 20900, stock: 0, colorHex: "#52525b" },
      { name: "Silent", sku: "QLL-SIL", priceCents: 21900, stock: 5, colorHex: "#71717a" },
    ],
    reviews: [
      { author: "Gilang P.", rating: 5, title: "Gasket feel at this price", body: "Sounds deeper than boards twice the cost. Hot-swap is a bonus." },
      { author: "Tara B.", rating: 5, body: "Silent switches are genuinely office-safe." },
      { author: "Ivan K.", rating: 4, body: "Great board, wish it shipped with a coiled cable." },
    ],
  },
  {
    slug: "lumen",
    name: "Lumen",
    tagline: "Dimmable desk lamp",
    description:
      "A weighted desk lamp with a warm-to-cool range and no visible LED dots. Touch dial on the base, braided cable, replaceable bulb module.",
    category: "workspace",
    variants: [
      { name: "Matte Black", sku: "LMN-BLK", priceCents: 13900, stock: 13, colorHex: "#18181b" },
      { name: "Sand", sku: "LMN-SND", priceCents: 13900, stock: 5, colorHex: "#d6c7b0" },
      { name: "Brass", sku: "LMN-BRS", priceCents: 15900, stock: 4, colorHex: "#b08d57" },
    ],
    reviews: [
      { author: "Sari M.", rating: 5, title: "No glare on the screen", body: "The diffuser actually works. Dial is smooth." },
      { author: "Ben O.", rating: 4, body: "Heavy base, good cable. Warm end could go warmer." },
    ],
  },
  {
    slug: "ledger",
    name: "Ledger",
    tagline: "Linen notebook and brass pen",
    description:
      "A lay-flat linen notebook with 160 pages of 100 gsm paper, paired with a brass pen that ages with use. Refill takes standard D1 cartridges.",
    category: "workspace",
    variants: [
      { name: "Set / Sand", sku: "LDG-SND", priceCents: 6400, stock: 40, colorHex: "#d6c7b0" },
      { name: "Set / Charcoal", sku: "LDG-CHA", priceCents: 6400, stock: 25, colorHex: "#3f3f46" },
      { name: "Set / Forest", sku: "LDG-FOR", priceCents: 6400, stock: 0, colorHex: "#1f3d2b" },
    ],
    reviews: [
      { author: "Ayu D.", rating: 5, body: "Paper handles fountain ink without bleed. Pen is heavier than expected, in a good way." },
      { author: "Riko S.", rating: 4, title: "Great gift", body: "Bought two. The brass patina shows up fast." },
    ],
  },
  {
    slug: "carry-01",
    name: "Carry 01",
    tagline: "Waxed canvas daily pouch",
    description:
      "A waxed canvas pouch for cables, adapters, and the things that migrate to the bottom of a bag. Water-resistant, brass zip, cotton lining.",
    category: "accessories",
    variants: [
      { name: "Olive", sku: "CRY-OLV", priceCents: 8900, stock: 17, colorHex: "#4d5d3a" },
      { name: "Black", sku: "CRY-BLK", priceCents: 8900, stock: 9, colorHex: "#18181b" },
      { name: "Clay", sku: "CRY-CLY", priceCents: 8900, stock: 2, colorHex: "#b45309" },
      { name: "Sand", sku: "CRY-SND", priceCents: 8900, stock: 6, colorHex: "#d6c7b0" },
    ],
    reviews: [
      { author: "Niko H.", rating: 5, title: "Fits a charger and three cables", body: "The wax smell fades after a week, then it just looks better." },
      { author: "Wulan P.", rating: 4, body: "Zip is stiff at first. Good size for a backpack pocket." },
      { author: "Teguh A.", rating: 5, body: "Second one, bought for my partner." },
    ],
  },
  {
    slug: "tether",
    name: "Tether",
    tagline: "Braided USB-C cable, 2 m",
    description:
      "A 2-metre braided USB-C cable rated for 240 W and 10 Gbps, with a strain relief that survives being yanked out of a laptop.",
    category: "accessories",
    variants: [
      { name: "Black", sku: "TTH-BLK", priceCents: 3900, stock: 60, colorHex: "#18181b" },
      { name: "White", sku: "TTH-WHT", priceCents: 3900, stock: 34, colorHex: "#f4f4f5" },
      { name: "Olive", sku: "TTH-OLV", priceCents: 3900, stock: 45, colorHex: "#4d5d3a" },
    ],
    reviews: [
      { author: "Yudi C.", rating: 5, body: "Charges a laptop at full speed and the braid has not frayed." },
      { author: "Mira S.", rating: 4, title: "Stiff, but fine", body: "Slightly stiff at the ends, otherwise perfect." },
    ],
  },
  {
    slug: "anchor",
    name: "Anchor",
    tagline: "Universal travel adapter",
    description:
      "A travel adapter with grounded plugs for 150 countries, a 65 W USB-C port, and a fuse you can replace without a screwdriver.",
    category: "accessories",
    variants: [
      { name: "Black", sku: "ANC-BLK", priceCents: 4900, stock: 0, colorHex: "#18181b" },
      { name: "White", sku: "ANC-WHT", priceCents: 4900, stock: 27, colorHex: "#f4f4f5" },
      { name: "Sand", sku: "ANC-SND", priceCents: 4900, stock: 11, colorHex: "#d6c7b0" },
    ],
    reviews: [
      { author: "Ryan F.", rating: 5, title: "One adapter for everything", body: "Charged a laptop and two phones in Tokyo without a fight." },
      { author: "Indah L.", rating: 4, body: "Bulky but solid. Fuse access is a nice touch." },
    ],
  },
  {
    slug: "orbit",
    name: "Orbit",
    tagline: "Brass keyring with tracker slot",
    description:
      "A machined brass keyring with a hidden slot for a coin-cell tracker and a spring gate that does not open in a pocket.",
    category: "accessories",
    variants: [
      { name: "Brass", sku: "ORB-BRS", priceCents: 5900, stock: 0, colorHex: "#b08d57" },
      { name: "Steel", sku: "ORB-STL", priceCents: 5900, stock: 0, colorHex: "#a1a1aa" },
      { name: "Black", sku: "ORB-BLK", priceCents: 5900, stock: 0, colorHex: "#18181b" },
    ],
    reviews: [
      { author: "Bayu A.", rating: 5, title: "Heavy in the right way", body: "Tracker slot is hidden well. Gate has not opened once." },
    ],
  },
];

const promos = [
  { code: "DISKON10", type: "PERCENT", value: 10, minSubtotalCents: 5000, maxDiscountCents: 5000 },
  { code: "FREESHIP", type: "FREESHIP", value: 0, minSubtotalCents: 7500, maxDiscountCents: null },
  { code: "WELCOME5", type: "FIXED", value: 500, minSubtotalCents: 2500, maxDiscountCents: null },
];

async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.product.deleteMany();
    await db.promoCode.deleteMany();
    console.log("reset: removed orders, products, promos");
  }

  for (const item of products) {
    const minPriceCents = Math.min(...item.variants.map((variant) => variant.priceCents));
    const ratingCount = item.reviews.length;
    const ratingAvg = ratingCount
      ? item.reviews.reduce((total, review) => total + review.rating, 0) / ratingCount
      : 0;

    const product = await db.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        category: item.category,
        badge: item.badge ?? null,
        featured: item.featured ?? false,
        minPriceCents,
        ratingAvg,
        ratingCount,
      },
      update: {
        name: item.name,
        tagline: item.tagline,
        description: item.description,
        category: item.category,
        badge: item.badge ?? null,
        featured: item.featured ?? false,
        minPriceCents,
        ratingAvg,
        ratingCount,
      },
    });

    for (const variant of item.variants) {
      await db.variant.upsert({
        where: { sku: variant.sku },
        create: {
          sku: variant.sku,
          productId: product.id,
          name: variant.name,
          priceCents: variant.priceCents,
          stock: variant.stock,
          colorHex: variant.colorHex ?? null,
        },
        update: {
          productId: product.id,
          name: variant.name,
          priceCents: variant.priceCents,
          stock: variant.stock,
          colorHex: variant.colorHex ?? null,
        },
      });
    }

    await db.productImage.deleteMany({ where: { productId: product.id } });
    await db.productImage.createMany({
      data: [1, 2, 3].map((position) => ({
        productId: product.id,
        url: `/products/${item.slug}/0${position}.avif`,
        alt: `${item.name} — ${item.tagline} (view ${position})`,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        position,
      })),
    });

    await db.review.deleteMany({ where: { productId: product.id } });
    await db.review.createMany({
      data: item.reviews.map((review) => ({
        productId: product.id,
        author: review.author,
        rating: review.rating,
        title: review.title ?? null,
        body: review.body,
        verified: review.verified ?? true,
      })),
    });
  }

  for (const promo of promos) {
    await db.promoCode.upsert({
      where: { code: promo.code },
      create: {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        minSubtotalCents: promo.minSubtotalCents,
        maxDiscountCents: promo.maxDiscountCents,
        active: true,
      },
      update: {
        type: promo.type,
        value: promo.value,
        minSubtotalCents: promo.minSubtotalCents,
        maxDiscountCents: promo.maxDiscountCents,
        active: true,
      },
    });
  }

  const [productCount, variantCount, reviewCount, promoCount] = await Promise.all([
    db.product.count(),
    db.variant.count(),
    db.review.count(),
    db.promoCode.count(),
  ]);

  console.log(
    JSON.stringify({ products: productCount, variants: variantCount, reviews: reviewCount, promos: promoCount }),
  );

  if (productCount !== 14 || variantCount < 40 || reviewCount < 30 || promoCount !== 3) {
    throw new Error("seed invariants failed");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
