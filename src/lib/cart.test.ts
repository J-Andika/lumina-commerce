import { describe, expect, it } from "vitest";

import {
  EMPTY_CART,
  MAX_QTY_PER_ITEM,
  cartCount,
  cartReducer,
  cartSubtotalCents,
  clampQty,
  toPricingLines,
  type CartItem,
} from "./cart";

const item = (overrides: Partial<Omit<CartItem, "qty">> = {}): Omit<CartItem, "qty"> => ({
  variantId: "var_1",
  productSlug: "monolith",
  productName: "Monolith",
  variantName: "Obsidian",
  unitPriceCents: 34900,
  stock: 12,
  ...overrides,
});

describe("clampQty", () => {
  it("keeps a valid quantity", () => {
    expect(clampQty(2, 5)).toBe(2);
  });

  it("caps at stock", () => {
    expect(clampQty(9, 3)).toBe(3);
  });

  it("caps at the per-line maximum", () => {
    expect(clampQty(999, 500)).toBe(MAX_QTY_PER_ITEM);
  });

  it("returns zero for sold-out stock", () => {
    expect(clampQty(1, 0)).toBe(0);
  });
});

describe("cartReducer — add", () => {
  it("adds a new line with quantity 1", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", item: item() });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.qty).toBe(1);
  });

  it("merges the same variant", () => {
    const once = cartReducer(EMPTY_CART, { type: "add", item: item(), qty: 2 });
    const twice = cartReducer(once, { type: "add", item: item(), qty: 3 });

    expect(twice.items).toHaveLength(1);
    expect(twice.items[0]?.qty).toBe(5);
  });

  it("caps a merge at stock", () => {
    const state = cartReducer(
      cartReducer(EMPTY_CART, { type: "add", item: item({ stock: 4 }), qty: 3 }),
      { type: "add", item: item({ stock: 4 }), qty: 5 },
    );

    expect(state.items[0]?.qty).toBe(4);
  });

  it("caps an add at the per-line maximum", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", item: item({ stock: 100 }), qty: 50 });

    expect(state.items[0]?.qty).toBe(MAX_QTY_PER_ITEM);
  });

  it("ignores a sold-out variant", () => {
    const state = cartReducer(EMPTY_CART, { type: "add", item: item({ stock: 0 }) });

    expect(state.items).toHaveLength(0);
  });
});

describe("cartReducer — quantity and removal", () => {
  const withOne = cartReducer(EMPTY_CART, { type: "add", item: item(), qty: 2 });

  it("clamps a quantity update to stock", () => {
    const state = cartReducer(withOne, { type: "setQty", variantId: "var_1", qty: 99 });

    expect(state.items[0]?.qty).toBe(10);
  });

  it("removes a line when the quantity reaches zero", () => {
    const state = cartReducer(withOne, { type: "setQty", variantId: "var_1", qty: 0 });

    expect(state.items).toHaveLength(0);
  });

  it("removes a line explicitly", () => {
    expect(cartReducer(withOne, { type: "remove", variantId: "var_1" }).items).toHaveLength(0);
  });

  it("returns the same state for an unknown variant", () => {
    expect(cartReducer(withOne, { type: "remove", variantId: "nope" })).toBe(withOne);
  });

  it("clears everything including the promo", () => {
    const state = cartReducer(
      cartReducer(withOne, { type: "setPromo", code: "diskon10" }),
      { type: "clear" },
    );

    expect(state).toEqual(EMPTY_CART);
  });
});

describe("cartReducer — promo", () => {
  it("normalises the code", () => {
    expect(cartReducer(EMPTY_CART, { type: "setPromo", code: "  freeship " }).promoCode).toBe(
      "FREESHIP",
    );
  });

  it("clears the code", () => {
    const state = cartReducer(
      cartReducer(EMPTY_CART, { type: "setPromo", code: "FREESHIP" }),
      { type: "clearPromo" },
    );

    expect(state.promoCode).toBeNull();
  });
});

describe("cartReducer — hydrate", () => {
  it("dedupes by variant and clamps quantities", () => {
    const state = cartReducer(EMPTY_CART, {
      type: "hydrate",
      state: {
        promoCode: "diskon10",
        items: [
          { ...item(), qty: 99 },
          { ...item(), qty: 2 },
          { ...item({ variantId: "var_2", stock: 0 }), qty: 1 },
        ],
      },
    });

    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.qty).toBe(MAX_QTY_PER_ITEM);
    expect(state.promoCode).toBe("DISKON10");
  });

  it("drops malformed rows", () => {
    const state = cartReducer(EMPTY_CART, {
      type: "hydrate",
      state: { promoCode: null, items: [{ ...item({ variantId: "" }), qty: 1 }] },
    });

    expect(state.items).toHaveLength(0);
  });
});

describe("selectors", () => {
  const state = cartReducer(
    cartReducer(EMPTY_CART, { type: "add", item: item(), qty: 2 }),
    { type: "add", item: item({ variantId: "var_2", unitPriceCents: 8900, stock: 5 }), qty: 3 },
  );

  it("counts units", () => {
    expect(cartCount(state)).toBe(5);
  });

  it("sums the subtotal in cents", () => {
    expect(cartSubtotalCents(state)).toBe(34900 * 2 + 8900 * 3);
  });

  it("maps to pricing lines", () => {
    const lines = toPricingLines(state);

    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ variantId: "var_1", qty: 2, unitPriceCents: 34900 });
    expect(lines[0]?.name).toContain("Monolith");
  });
});
