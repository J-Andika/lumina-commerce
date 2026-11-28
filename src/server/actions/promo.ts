"use server";

import { normalizePromoCode } from "@/lib/promo";
import { db } from "@/server/db";

export type PublicPromo = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREESHIP";
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
};

export type PromoLookup =
  | { ok: true; promo: PublicPromo }
  | { ok: false; error: "NOT_FOUND" };

/**
 * Returns only the fields the cart needs to evaluate a code for display.
 * The amount is still recomputed on the server at checkout.
 */
export async function lookupPromo(rawCode: string): Promise<PromoLookup> {
  const code = normalizePromoCode(rawCode);
  if (!code) return { ok: false, error: "NOT_FOUND" };

  const promo = await db.promoCode.findUnique({ where: { code } });
  if (!promo) return { ok: false, error: "NOT_FOUND" };

  return {
    ok: true,
    promo: {
      code: promo.code,
      type: promo.type as PublicPromo["type"],
      value: promo.value,
      minSubtotalCents: promo.minSubtotalCents,
      maxDiscountCents: promo.maxDiscountCents,
      maxUses: promo.maxUses,
      usedCount: promo.usedCount,
      active: promo.active,
      expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
    },
  };
}
