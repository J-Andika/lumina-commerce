import { describe, expect, it } from "vitest";

import { evaluatePromo, normalizePromoCode, type PromoRecord } from "./promo";

const base: PromoRecord = {
  code: "DISKON10",
  type: "PERCENT",
  value: 10,
  minSubtotalCents: 5_000,
  maxDiscountCents: 5_000,
  maxUses: null,
  usedCount: 0,
  active: true,
  expiresAt: null,
};

const record = (overrides: Partial<PromoRecord> = {}): PromoRecord => ({ ...base, ...overrides });

describe("normalizePromoCode", () => {
  it("trims and upper-cases", () => {
    expect(normalizePromoCode("  diskon10 ")).toBe("DISKON10");
  });
});

describe("evaluatePromo — rejections", () => {
  it("rejects an unknown code", () => {
    expect(evaluatePromo({ promo: null, subtotalCents: 10_000 })).toMatchObject({
      ok: false,
      error: "NOT_FOUND",
    });
  });

  it("rejects an inactive code", () => {
    expect(evaluatePromo({ promo: record({ active: false }), subtotalCents: 10_000 })).toMatchObject({
      ok: false,
      error: "INACTIVE",
    });
  });

  it("rejects an expired code", () => {
    const result = evaluatePromo({
      promo: record({ expiresAt: new Date("2026-01-01T00:00:00Z") }),
      subtotalCents: 10_000,
      now: new Date("2026-06-01T00:00:00Z"),
    });

    expect(result).toMatchObject({ ok: false, error: "EXPIRED" });
  });

  it("accepts a code that expires later", () => {
    const result = evaluatePromo({
      promo: record({ expiresAt: new Date("2026-12-01T00:00:00Z") }),
      subtotalCents: 10_000,
      now: new Date("2026-06-01T00:00:00Z"),
    });

    expect(result.ok).toBe(true);
  });

  it("rejects a code that hit its usage limit", () => {
    expect(
      evaluatePromo({ promo: record({ maxUses: 3, usedCount: 3 }), subtotalCents: 10_000 }),
    ).toMatchObject({ ok: false, error: "MAX_USES" });
  });

  it("allows a code with remaining uses", () => {
    expect(
      evaluatePromo({ promo: record({ maxUses: 3, usedCount: 2 }), subtotalCents: 10_000 }).ok,
    ).toBe(true);
  });

  it("reports the shortfall below the minimum subtotal", () => {
    const result = evaluatePromo({ promo: record(), subtotalCents: 4_999 });

    expect(result).toMatchObject({
      ok: false,
      error: "MIN_SUBTOTAL",
      shortfallCents: 1,
    });
  });

  it("accepts exactly the minimum subtotal", () => {
    expect(evaluatePromo({ promo: record(), subtotalCents: 5_000 }).ok).toBe(true);
  });

  it("rejects a misconfigured percentage", () => {
    expect(
      evaluatePromo({ promo: record({ value: 150 }), subtotalCents: 10_000 }),
    ).toMatchObject({ ok: false, error: "INVALID_VALUE" });
  });

  it("rejects a zero value", () => {
    expect(
      evaluatePromo({ promo: record({ value: 0 }), subtotalCents: 10_000 }),
    ).toMatchObject({ ok: false, error: "INVALID_VALUE" });
  });
});

describe("evaluatePromo — amounts", () => {
  it("takes a percentage of the subtotal", () => {
    expect(evaluatePromo({ promo: record(), subtotalCents: 34_900 })).toMatchObject({
      ok: true,
      discountCents: 3_490,
      freeShipping: false,
    });
  });

  it("rounds a percentage to the nearest cent", () => {
    expect(
      evaluatePromo({
        promo: record({ minSubtotalCents: 0 }),
        subtotalCents: 3_333,
      }),
    ).toMatchObject({ discountCents: 333 });
  });

  it("caps a percentage discount", () => {
    expect(
      evaluatePromo({ promo: record({ maxDiscountCents: 5_000 }), subtotalCents: 100_000 }),
    ).toMatchObject({ discountCents: 5_000 });
  });

  it("applies a fixed discount", () => {
    expect(
      evaluatePromo({
        promo: record({ type: "FIXED", value: 500, minSubtotalCents: 0 }),
        subtotalCents: 2_500,
      }),
    ).toMatchObject({ discountCents: 500 });
  });

  it("never discounts more than the subtotal", () => {
    expect(
      evaluatePromo({
        promo: record({ type: "FIXED", value: 500, minSubtotalCents: 0 }),
        subtotalCents: 300,
      }),
    ).toMatchObject({ discountCents: 300 });
  });

  it("returns free shipping with no discount for FREESHIP", () => {
    expect(
      evaluatePromo({
        promo: record({ type: "FREESHIP", value: 0, minSubtotalCents: 7_500 }),
        subtotalCents: 7_500,
      }),
    ).toMatchObject({ ok: true, discountCents: 0, freeShipping: true });
  });
});
