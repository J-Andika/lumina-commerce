/**
 * Promo code domain. Pure and synchronous: the caller loads the row, this module
 * decides whether it applies and how much it is worth. Only one code per order.
 */

import { formatMoney } from "./money";

export const PROMO_TYPES = ["PERCENT", "FIXED", "FREESHIP"] as const;
export type PromoType = (typeof PROMO_TYPES)[number];

export type PromoRecord = {
  code: string;
  type: PromoType;
  /** Percent points for PERCENT, cents for FIXED, ignored for FREESHIP. */
  value: number;
  minSubtotalCents: number;
  maxDiscountCents?: number | null;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: Date | null;
};

export type PromoErrorCode =
  | "NOT_FOUND"
  | "INACTIVE"
  | "EXPIRED"
  | "MIN_SUBTOTAL"
  | "MAX_USES"
  | "INVALID_VALUE";

export type PromoEvaluation =
  | {
      ok: true;
      code: string;
      type: PromoType;
      discountCents: number;
      freeShipping: boolean;
      label: string;
    }
  | {
      ok: false;
      error: PromoErrorCode;
      message: string;
      shortfallCents?: number;
    };

export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase();
}

function reject(
  error: PromoErrorCode,
  message: string,
  shortfallCents?: number,
): PromoEvaluation {
  return { ok: false, error, message, ...(shortfallCents ? { shortfallCents } : {}) };
}

export function evaluatePromo(input: {
  promo: PromoRecord | null;
  subtotalCents: number;
  now?: Date;
}): PromoEvaluation {
  const { promo, subtotalCents } = input;
  const now = input.now ?? new Date();

  if (!promo) {
    return reject("NOT_FOUND", "That code does not exist");
  }

  if (!promo.active) {
    return reject("INACTIVE", "That code is no longer available");
  }

  if (promo.expiresAt && promo.expiresAt.getTime() <= now.getTime()) {
    return reject("EXPIRED", "That code has expired");
  }

  if (promo.maxUses !== null && promo.maxUses !== undefined && promo.usedCount >= promo.maxUses) {
    return reject("MAX_USES", "That code has reached its limit");
  }

  if (subtotalCents < promo.minSubtotalCents) {
    const shortfall = promo.minSubtotalCents - subtotalCents;
    return reject(
      "MIN_SUBTOTAL",
      `Add ${formatMoney(shortfall)} more to use ${promo.code}`,
      shortfall,
    );
  }

  if (promo.type === "FREESHIP") {
    return {
      ok: true,
      code: promo.code,
      type: promo.type,
      discountCents: 0,
      freeShipping: true,
      label: "Free shipping",
    };
  }

  if (!Number.isInteger(promo.value) || promo.value <= 0) {
    return reject("INVALID_VALUE", "That code is misconfigured");
  }

  let discountCents: number;

  if (promo.type === "PERCENT") {
    if (promo.value > 100) {
      return reject("INVALID_VALUE", "That code is misconfigured");
    }
    discountCents = Math.round((subtotalCents * promo.value) / 100);
  } else if (promo.type === "FIXED") {
    discountCents = promo.value;
  } else {
    return reject("INVALID_VALUE", "That code is misconfigured");
  }

  if (promo.maxDiscountCents !== null && promo.maxDiscountCents !== undefined) {
    discountCents = Math.min(discountCents, promo.maxDiscountCents);
  }

  discountCents = Math.min(discountCents, subtotalCents);

  const label =
    promo.type === "PERCENT" ? `${promo.value}% off` : `${formatMoney(discountCents)} off`;

  return {
    ok: true,
    code: promo.code,
    type: promo.type,
    discountCents,
    freeShipping: false,
    label,
  };
}
