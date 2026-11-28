import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createOrder } from "./orders";
import { db } from "./db";
import { updateOrderStatus, updateStock } from "./admin";

let variantId = "";
let originalStock = 0;
const orders: string[] = [];

beforeAll(async () => {
  const variant = await db.variant.findUnique({ where: { sku: "TTH-WHT" } });
  if (!variant) throw new Error("seed missing TTH-WHT");
  variantId = variant.id;
  originalStock = variant.stock;
});

afterAll(async () => {
  await db.orderItem.deleteMany({ where: { orderId: { in: orders } } });
  await db.order.deleteMany({ where: { id: { in: orders } } });
  await db.variant.update({ where: { id: variantId }, data: { stock: originalStock } });
});

describe("updateStock", () => {
  it("writes a new stock value", async () => {
    await updateStock(variantId, 7);
    const variant = await db.variant.findUniqueOrThrow({ where: { id: variantId } });

    expect(variant.stock).toBe(7);
  });

  it("allows zero to mark a variant sold out", async () => {
    await updateStock(variantId, 0);
    const variant = await db.variant.findUniqueOrThrow({ where: { id: variantId } });

    expect(variant.stock).toBe(0);
  });

  it("rejects negative and fractional values", async () => {
    await expect(updateStock(variantId, -1)).rejects.toThrow(/whole number/);
    await expect(updateStock(variantId, 2.5)).rejects.toThrow(/whole number/);
  });
});

describe("updateOrderStatus", () => {
  beforeEach(async () => {
    await db.variant.update({ where: { id: variantId }, data: { stock: 10 } });
  });

  const address = {
    email: "admin-test@example.com",
    name: "Admin Test",
    address1: "1 Test Street",
    city: "Bandar Lampung",
    postal: "35141",
    country: "Indonesia",
    courier: "standard" as const,
    paymentMode: "sandbox" as const,
  };

  it("cancels a pending order", async () => {
    const order = await createOrder({ ...address, items: [{ variantId, qty: 1 }] });
    orders.push(order.id);

    await updateOrderStatus(order.id, "CANCELLED");
    const stored = await db.order.findUniqueOrThrow({ where: { id: order.id } });

    expect(stored.status).toBe("CANCELLED");
  });

  it("refuses to move a cancelled order back to paid", async () => {
    const order = await createOrder({ ...address, items: [{ variantId, qty: 1 }] });
    orders.push(order.id);
    await updateOrderStatus(order.id, "CANCELLED");

    await expect(updateOrderStatus(order.id, "PAID")).rejects.toThrow(/Cannot move/);
  });

  it("marks a pending order paid through the payment service", async () => {
    await db.variant.update({ where: { id: variantId }, data: { stock: 10 } });
    const order = await createOrder({ ...address, items: [{ variantId, qty: 1 }] });
    orders.push(order.id);

    const result = await updateOrderStatus(order.id, "PAID");
    const stored = await db.order.findUniqueOrThrow({ where: { id: order.id } });

    expect(result).toMatchObject({ status: "PAID" });
    expect(stored.status).toBe("PAID");
  });
});
