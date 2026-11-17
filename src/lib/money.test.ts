import { describe, expect, it } from "vitest";
import { formatMoney, sumCents } from "./money";

describe("formatMoney", () => {
  it("formats integer cents as USD", () => {
    expect(formatMoney(34900)).toBe("$349.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("rejects float input", () => {
    expect(() => formatMoney(12.5)).toThrow(TypeError);
  });
});

describe("sumCents", () => {
  it("sums integer cents without float drift", () => {
    expect(sumCents([10, 20, 30])).toBe(60);
  });

  it("rejects float input", () => {
    expect(() => sumCents([10, 0.1])).toThrow(TypeError);
  });
});
