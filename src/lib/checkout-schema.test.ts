import { describe, expect, it } from "vitest";
import { z } from "zod";

import { cartSchema, checkoutSchema, formatCheckoutErrors } from "./checkout-schema";

const valid = {
  email: "Buyer@Example.com",
  name: "Gew Andika",
  address1: "12 Jalan Melati",
  city: "Bandar Lampung",
  postal: "35141",
  country: "Indonesia",
  courier: "standard" as const,
  promoCode: "diskon10",
};

describe("checkoutSchema", () => {
  it("accepts a valid address and normalises email + promo", () => {
    const parsed = checkoutSchema.parse(valid);

    expect(parsed.email).toBe("buyer@example.com");
    expect(parsed.promoCode).toBe("DISKON10");
  });

  it("rejects a malformed email", () => {
    const result = checkoutSchema.safeParse({ ...valid, email: "nope" });

    expect(result.success).toBe(false);
  });

  it("rejects a short address", () => {
    expect(checkoutSchema.safeParse({ ...valid, address1: "12" }).success).toBe(false);
  });

  it("rejects a bad postal code", () => {
    expect(checkoutSchema.safeParse({ ...valid, postal: "!!" }).success).toBe(false);
  });

  it("rejects an unknown courier", () => {
    expect(checkoutSchema.safeParse({ ...valid, courier: "drone" }).success).toBe(false);
  });

  it("turns an empty promo into null", () => {
    expect(checkoutSchema.parse({ ...valid, promoCode: "  " }).promoCode).toBeNull();
  });
});

describe("cartSchema", () => {
  it("accepts a normal cart", () => {
    expect(cartSchema.safeParse([{ variantId: "v1", qty: 2 }]).success).toBe(true);
  });

  it("rejects an empty cart", () => {
    expect(cartSchema.safeParse([]).success).toBe(false);
  });

  it("rejects a zero quantity", () => {
    expect(cartSchema.safeParse([{ variantId: "v1", qty: 0 }]).success).toBe(false);
  });
});

describe("formatCheckoutErrors", () => {
  it("keeps the first message per field", () => {
    const result = checkoutSchema.safeParse({ ...valid, email: "x", name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = formatCheckoutErrors(result.error as z.ZodError);
      expect(Object.keys(errors)).toEqual(expect.arrayContaining(["email", "name"]));
    }
  });
});
