import { describe, expect, it } from "vitest";

import { checkCvc, checkExpiry, digitsOnly, formatCardNumber, luhnValid } from "./card";

describe("luhnValid", () => {
  it("accepts the Stripe test card", () => {
    expect(luhnValid("4242 4242 4242 4242")).toBe(true);
  });

  it("accepts 5555 5555 5555 4444", () => {
    expect(luhnValid("5555555555554444")).toBe(true);
  });

  it("rejects a wrong digit", () => {
    expect(luhnValid("4242424242424241")).toBe(false);
  });

  it("rejects short numbers", () => {
    expect(luhnValid("4242")).toBe(false);
  });

  it("rejects letters", () => {
    expect(luhnValid("abcd efgh ijkl mnop")).toBe(false);
  });
});

describe("formatCardNumber", () => {
  it("groups digits in fours and caps at 19 digits", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
    expect(digitsOnly(formatCardNumber("1".repeat(30)))).toHaveLength(19);
  });
});

describe("checkExpiry", () => {
  const now = new Date("2026-06-15T00:00:00Z");

  it("accepts a future month", () => {
    expect(checkExpiry("12/27", now).valid).toBe(true);
  });

  it("rejects the current month", () => {
    expect(checkExpiry("06/26", now).valid).toBe(false);
  });

  it("rejects a malformed value", () => {
    expect(checkExpiry("13/27", now).valid).toBe(false);
  });
});

describe("checkCvc", () => {
  it("accepts 3 or 4 digits", () => {
    expect(checkCvc("123")).toBe(true);
    expect(checkCvc("1234")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(checkCvc("12")).toBe(false);
    expect(checkCvc("12a")).toBe(false);
  });
});
