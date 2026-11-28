import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "./db";
import { OrderError, createOrder, markOrderPaid } from "./orders";

let variantId = "";
let lowStockVariantId = "";
let cheapVariantId = "";
let originalStock = 0;
const createdOrderIds: string[] = [];

beforeAll(async () => {
  const variant = await db.variant.findUnique({ where: { sku: "MON-OBS" } });
  if (!variant) throw new Error("seed missing MON-OBS");
  variantId = variant.id;
  originalStock = variant.stock;

  const lowStock = await db.variant.findUnique({ where: { sku: "MON-BON" } });
  if (!lowStock) throw new Error("seed missing MON-BON");
  lowStockVariantId = lowStock.id;

  const cheap = await db.variant.findUnique({ where: { sku: "TTH-BLK" } });
  if (!cheap) throw new Error("seed missing TTH-BLK");
  cheapVariantId = cheap.id;
});

afterAll(async () => {
  await db.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
  await db.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  await db.variant.update({ where: { id: variantId }, data: { stock: originalStock } });
  await db.promoCode.updateMany({ where: { code: "DISKON10" }, data: { usedCount: 0 } });
});

const address = {
  email: "buyer@example.com",
  name: "Gew Andika",
  address1: "12 Jalan Melati",
  city: "Bandar Lampung",
  postal: "35141",
  country: "Indonesia",
  courier: "standard" as const,
  paymentMode: "sandbox" as const,
};

describe("createOrder", () => {
  it("recomputes totals from the database", async () => {
    const order = await createOrder({ ...address, items: [{ variantId, qty: 2 }] });
    createdOrderIds.push(order.id);

    expect(order.status).toBe("PENDING");
    expect(order.subtotalCents).toBe(34900 * 2);
    expect(order.shippingCents).toBe(0);
    expect(order.totalCents).toBe(69800);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.nameSnapshot).toContain("Monolith");
  });

  it("applies a valid promo and stores it", async () => {
    const order = await createOrder({
      ...address,
      items: [{ variantId, qty: 1 }],
      promoCode: "diskon10",
    });
    createdOrderIds.push(order.id);

    expect(order.discountCents).toBe(3490);
    expect(order.promoCode).toBe("DISKON10");
    expect(order.totalCents).toBe(34900 - 3490);
  });

  it("ignores an unknown promo", async () => {
    const order = await createOrder({
      ...address,
      items: [{ variantId, qty: 1 }],
      promoCode: "NOPE",
    });
    createdOrderIds.push(order.id);

    expect(order.discountCents).toBe(0);
    expect(order.promoCode).toBeNull();
  });

  it("rejects an empty cart", async () => {
    await expect(createOrder({ ...address, items: [] })).rejects.toMatchObject({ code: "EMPTY_CART" });
  });

  it("rejects a quantity above stock", async () => {
    await expect(
      createOrder({ ...address, items: [{ variantId: lowStockVariantId, qty: 10 }] }),
    ).rejects.toBeInstanceOf(OrderError);
  });

  it("rejects an unknown variant", async () => {
    await expect(
      createOrder({ ...address, items: [{ variantId: "missing", qty: 1 }] }),
    ).rejects.toMatchObject({ code: "UNKNOWN_VARIANT" });
  });

  it("charges express shipping below the threshold", async () => {
    const order = await createOrder({
      ...address,
      courier: "express",
      items: [{ variantId: cheapVariantId, qty: 1 }],
    });
    createdOrderIds.push(order.id);

    expect(order.shippingCents).toBe(1800);
  });

  it("gives free express shipping above the threshold", async () => {
    const order = await createOrder({
      ...address,
      courier: "express",
      items: [{ variantId, qty: 1 }],
    });
    createdOrderIds.push(order.id);

    expect(order.shippingCents).toBe(0);
  });
});

describe("markOrderPaid", () => {
  it("marks paid once and decrements stock once", async () => {
    const order = await createOrder({ ...address, items: [{ variantId, qty: 3 }] });
    createdOrderIds.push(order.id);

    const before = await db.variant.findUniqueOrThrow({ where: { id: variantId } });
    const first = await markOrderPaid(order.id);
    const second = await markOrderPaid(order.id);
    const after = await db.variant.findUniqueOrThrow({ where: { id: variantId } });

    expect(first.status).toBe("PAID");
    expect(second.status).toBe("ALREADY_PAID");
    expect(after.stock).toBe(before.stock - 3);

    const stored = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.status).toBe("PAID");
    expect(stored.paidAt).not.toBeNull();
  });

  it("cancels when stock disappeared between order and payment", async () => {
    const order = await createOrder({ ...address, items: [{ variantId, qty: 1 }] });
    createdOrderIds.push(order.id);

    await db.variant.update({ where: { id: variantId }, data: { stock: 0 } });

    const result = await markOrderPaid(order.id);

    expect(result.status).toBe("CANCELLED");

    await db.variant.update({ where: { id: variantId }, data: { stock: originalStock } });
  });
});
