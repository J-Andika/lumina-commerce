import { describe, expect, it } from "vitest";

import { generateOrderNumber, isValidOrderNumber } from "./order-number";

describe("generateOrderNumber", () => {
  it("formats as LUM- plus five digits", () => {
    expect(generateOrderNumber(() => 0)).toBe("LUM-10000");
    expect(generateOrderNumber(() => 0.999999)).toMatch(/^LUM-\d{5}$/);
  });

  it("stays within the five-digit range", () => {
    for (const value of [0, 0.25, 0.5, 0.75, 0.99]) {
      const number = generateOrderNumber(() => value);
      expect(isValidOrderNumber(number)).toBe(true);
      expect(Number(number.slice(4))).toBeGreaterThanOrEqual(10000);
      expect(Number(number.slice(4))).toBeLessThanOrEqual(99999);
    }
  });
});

describe("isValidOrderNumber", () => {
  it("rejects malformed numbers", () => {
    expect(isValidOrderNumber("LUM-1234")).toBe(false);
    expect(isValidOrderNumber("12345")).toBe(false);
  });
});
