import { describe, expect, it } from "vitest";

import { allowedTransitions, canTransition, isLowStock } from "./admin";

describe("allowedTransitions", () => {
  it("lets a pending order become paid or cancelled", () => {
    expect(allowedTransitions("PENDING").sort()).toEqual(["CANCELLED", "PAID"]);
  });

  it("lets a paid order be fulfilled or cancelled", () => {
    expect(allowedTransitions("PAID").sort()).toEqual(["CANCELLED", "FULFILLED"]);
  });

  it("freezes terminal states", () => {
    expect(allowedTransitions("FULFILLED")).toEqual([]);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
  });
});

describe("canTransition", () => {
  it("rejects resurrecting a cancelled order", () => {
    expect(canTransition("CANCELLED", "PAID")).toBe(false);
  });

  it("allows the happy path", () => {
    expect(canTransition("PENDING", "PAID")).toBe(true);
    expect(canTransition("PAID", "FULFILLED")).toBe(true);
  });
});

describe("isLowStock", () => {
  it("flags five or fewer units", () => {
    expect(isLowStock(5)).toBe(true);
    expect(isLowStock(6)).toBe(false);
  });

  it("flags zero", () => {
    expect(isLowStock(0)).toBe(true);
  });
});
