import { describe, expect, it } from "vitest";

import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  PricingError,
  priceCart,
  type PricingLine,
} from "./pricing";

const line = (overrides: Partial<PricingLine> = {}): PricingLine => ({
  variantId: "var_1",
  name: "Monolith",
  unitPriceCents: 34900,
  qty: 1,
  stock: 12,
  ...overrides,
});

describe("priceCart — totals", () => {
  it("sums multiple lines without float drift", () => {
    const result = priceCart({
      courier: "standard",
      lines: [
        line({ variantId: "a", unitPriceCents: 1999, qty: 3 }),
        line({ variantId: "b", unitPriceCents: 250, qty: 4, stock: 10 }),
      ],
    });

    expect(result.subtotalCents).toBe(1999 * 3 + 250 * 4);
    expect(result.totalCents).toBe(result.subtotalCents + result.shippingCents);
  });

  it("returns zeros for an empty cart", () => {
    const result = priceCart({ courier: "standard", lines: [] });

    expect(result).toMatchObject({
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
      freeShippingRemainingCents: 0,
    });
  });

  it("charges standard shipping below the threshold", () => {
    const result = priceCart({ courier: "standard", lines: [line({ unitPriceCents: 5000 })] });

    expect(result.shippingCents).toBe(800);
    expect(result.totalCents).toBe(5800);
  });

  it("charges express shipping below the threshold", () => {
    const result = priceCart({ courier: "express", lines: [line({ unitPriceCents: 5000 })] });

    expect(result.shippingCents).toBe(1800);
  });

  it("is not free at $99.99", () => {
    const result = priceCart({ courier: "standard", lines: [line({ unitPriceCents: 9999 })] });

    expect(result.shippingCents).toBe(800);
    expect(result.freeShippingRemainingCents).toBe(1);
  });

  it("is free at exactly $100.00", () => {
    const result = priceCart({
      courier: "standard",
      lines: [line({ unitPriceCents: FREE_SHIPPING_THRESHOLD_CENTS })],
    });

    expect(result.shippingCents).toBe(0);
    expect(result.freeShippingRemainingCents).toBe(0);
    expect(result.totalCents).toBe(FREE_SHIPPING_THRESHOLD_CENTS);
  });

  it("evaluates the threshold on the post-discount subtotal", () => {
    const result = priceCart({
      courier: "standard",
      lines: [line({ unitPriceCents: 12_000 })],
      discountCents: 2_500,
    });

    expect(result.subtotalCents).toBe(12_000);
    expect(result.discountCents).toBe(2_500);
    expect(result.shippingCents).toBe(800);
    expect(result.totalCents).toBe(10_300);
  });

  it("keeps free shipping when the discount still leaves $100", () => {
    const result = priceCart({
      courier: "standard",
      lines: [line({ unitPriceCents: 15_000 })],
      discountCents: 5_000,
    });

    expect(result.shippingCents).toBe(0);
  });

  it("clamps a discount larger than the subtotal", () => {
    const result = priceCart({
      courier: "standard",
      lines: [line({ unitPriceCents: 1_000 })],
      discountCents: 9_999,
    });

    expect(result.discountCents).toBe(1_000);
    expect(result.totalCents).toBe(800);
  });

  it("honours a free-shipping promo under the threshold", () => {
    const result = priceCart({
      courier: "express",
      lines: [line({ unitPriceCents: 7_500 })],
      freeShipping: true,
    });

    expect(result.shippingCents).toBe(0);
    expect(result.freeShippingRemainingCents).toBe(0);
  });

  it("always reports tax as zero", () => {
    const result = priceCart({ courier: "standard", lines: [line()] });

    expect(result.taxCents).toBe(0);
  });

  it("rounds nothing on the total: input cents stay cents", () => {
    const result = priceCart({ courier: "standard", lines: [line({ unitPriceCents: 333 })] });

    expect(result.subtotalCents).toBe(333);
    expect(result.totalCents).toBe(333 + 800);
  });
});

describe("priceCart — validation", () => {
  it("rejects a zero quantity", () => {
    expect(() => priceCart({ courier: "standard", lines: [line({ qty: 0 })] })).toThrow(PricingError);
  });

  it("rejects a fractional quantity", () => {
    expect(() => priceCart({ courier: "standard", lines: [line({ qty: 1.5 })] })).toThrow(
      /positive integer/,
    );
  });

  it("rejects quantity above stock", () => {
    expect(() =>
      priceCart({ courier: "standard", lines: [line({ qty: 4, stock: 3 })] }),
    ).toThrow(/exceeds stock/);
  });

  it("rejects a fractional price", () => {
    expect(() => priceCart({ courier: "standard", lines: [line({ unitPriceCents: 19.99 })] })).toThrow(
      /non-negative integer/,
    );
  });

  it("rejects a line without a variant id", () => {
    expect(() => priceCart({ courier: "standard", lines: [line({ variantId: "" })] })).toThrow(
      /variant id/,
    );
  });

  it("rejects an unknown courier", () => {
    expect(() =>
      priceCart({ courier: "drone" as never, lines: [line()] }),
    ).toThrow(/Unknown courier/);
  });

  it("rejects a negative discount", () => {
    expect(() => priceCart({ courier: "standard", lines: [line()], discountCents: -1 })).toThrow(
      /Discount/,
    );
  });

  it("exposes a machine-readable error code", () => {
    try {
      priceCart({ courier: "standard", lines: [line({ qty: 0 })] });
      throw new Error("expected a throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PricingError);
      expect((error as PricingError).code).toBe("INVALID_QTY");
    }
  });
});
