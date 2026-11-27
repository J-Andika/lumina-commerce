/**
 * Cart domain. A pure reducer shared by the client (localStorage) and the server
 * (checkout validation). Quantities are clamped to stock and to a per-line cap;
 * prices here are display data only — the server always re-prices.
 */

import { normalizePromoCode } from "./promo";
import type { PricingLine } from "./pricing";

export const MAX_QTY_PER_ITEM = 10;

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantName: string;
  unitPriceCents: number;
  stock: number;
  imageUrl?: string;
  qty: number;
};

export type CartState = {
  items: CartItem[];
  promoCode: string | null;
};

export const EMPTY_CART: CartState = { items: [], promoCode: null };

export type CartAction =
  | { type: "add"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "setQty"; variantId: string; qty: number }
  | { type: "remove"; variantId: string }
  | { type: "setPromo"; code: string }
  | { type: "clearPromo" }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

export function clampQty(qty: number, stock: number): number {
  if (!Number.isFinite(qty) || !Number.isFinite(stock)) return 0;
  if (stock <= 0) return 0;

  return Math.max(1, Math.min(Math.floor(qty), stock, MAX_QTY_PER_ITEM));
}

function withItems(state: CartState, items: CartItem[]): CartState {
  return { ...state, items };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const requested = action.qty ?? 1;
      const existing = state.items.find((item) => item.variantId === action.item.variantId);

      if (existing) {
        const nextQty = clampQty(existing.qty + requested, existing.stock);
        if (nextQty === existing.qty) return state;

        return withItems(
          state,
          state.items.map((item) =>
            item.variantId === existing.variantId ? { ...item, qty: nextQty } : item,
          ),
        );
      }

      const qty = clampQty(requested, action.item.stock);
      if (qty === 0) return state;

      return withItems(state, [...state.items, { ...action.item, qty }]);
    }

    case "setQty": {
      const existing = state.items.find((item) => item.variantId === action.variantId);
      if (!existing) return state;

      if (action.qty <= 0) {
        return withItems(
          state,
          state.items.filter((item) => item.variantId !== action.variantId),
        );
      }

      const nextQty = clampQty(action.qty, existing.stock);
      if (nextQty === existing.qty) return state;

      return withItems(
        state,
        state.items.map((item) =>
          item.variantId === action.variantId ? { ...item, qty: nextQty } : item,
        ),
      );
    }

    case "remove": {
      if (!state.items.some((item) => item.variantId === action.variantId)) return state;

      return withItems(
        state,
        state.items.filter((item) => item.variantId !== action.variantId),
      );
    }

    case "setPromo":
      return { ...state, promoCode: normalizePromoCode(action.code) || null };

    case "clearPromo":
      return { ...state, promoCode: null };

    case "clear":
      return EMPTY_CART;

    case "hydrate": {
      const seen = new Set<string>();
      const items: CartItem[] = [];

      for (const item of action.state.items ?? []) {
        if (!item?.variantId || seen.has(item.variantId)) continue;
        const qty = clampQty(item.qty, item.stock);
        if (qty === 0) continue;

        seen.add(item.variantId);
        items.push({ ...item, qty });
      }

      return {
        items,
        promoCode: action.state.promoCode ? normalizePromoCode(action.state.promoCode) : null,
      };
    }

    default:
      return state;
  }
}

export function cartCount(state: CartState): number {
  return state.items.reduce((total, item) => total + item.qty, 0);
}

export function cartSubtotalCents(state: CartState): number {
  return state.items.reduce((total, item) => total + item.unitPriceCents * item.qty, 0);
}

export function toPricingLines(state: CartState): PricingLine[] {
  return state.items.map((item) => ({
    variantId: item.variantId,
    name: `${item.productName} — ${item.variantName}`,
    unitPriceCents: item.unitPriceCents,
    qty: item.qty,
    stock: item.stock,
  }));
}
