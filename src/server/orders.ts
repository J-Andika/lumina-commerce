import { generateOrderNumber } from "@/lib/order-number";
import { priceCart, type PricingLine } from "@/lib/pricing";
import { evaluatePromo, normalizePromoCode, type PromoRecord } from "@/lib/promo";

import { db } from "./db";

export type OrderItemInput = { variantId: string; qty: number };

export type CreateOrderInput = {
  items: OrderItemInput[];
  email: string;
  name: string;
  address1: string;
  city: string;
  postal: string;
  country: string;
  courier: "standard" | "express";
  promoCode?: string | null;
  paymentMode: "stripe" | "sandbox";
};

export type OrderErrorCode =
  | "EMPTY_CART"
  | "UNKNOWN_VARIANT"
  | "OUT_OF_STOCK"
  | "ORDER_NOT_FOUND";

export class OrderError extends Error {
  readonly code: OrderErrorCode;
  readonly detail?: string;

  constructor(code: OrderErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "OrderError";
    this.code = code;
    this.detail = detail;
  }
}

function mergeItems(items: OrderItemInput[]): OrderItemInput[] {
  const merged = new Map<string, number>();

  for (const item of items) {
    if (!item.variantId || !Number.isInteger(item.qty) || item.qty < 1) continue;
    merged.set(item.variantId, Math.min((merged.get(item.variantId) ?? 0) + item.qty, 10));
  }

  return [...merged.entries()].map(([variantId, qty]) => ({ variantId, qty }));
}

async function uniqueOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = generateOrderNumber();
    const exists = await db.order.findUnique({ where: { number: candidate } });
    if (!exists) return candidate;
  }

  throw new OrderError("ORDER_NOT_FOUND", "Could not allocate an order number");
}

/**
 * Creates a PENDING order from cart items. Prices, discounts, and shipping are
 * always recomputed here; nothing from the client is trusted.
 */
export async function createOrder(input: CreateOrderInput) {
  const items = mergeItems(input.items);
  if (items.length === 0) throw new OrderError("EMPTY_CART", "Your cart is empty");

  const variants = await db.variant.findMany({
    where: { id: { in: items.map((item) => item.variantId) } },
    include: { product: true },
  });

  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const lines: PricingLine[] = [];

  for (const item of items) {
    const variant = byId.get(item.variantId);
    if (!variant) {
      throw new OrderError("UNKNOWN_VARIANT", "A product in your cart is no longer available");
    }
    if (variant.stock < item.qty) {
      throw new OrderError(
        "OUT_OF_STOCK",
        `${variant.product.name} (${variant.name}) only has ${variant.stock} left`,
      );
    }

    lines.push({
      variantId: variant.id,
      name: `${variant.product.name} — ${variant.name}`,
      unitPriceCents: variant.priceCents,
      qty: item.qty,
      stock: variant.stock,
    });
  }

  const subtotalCents = lines.reduce((total, line) => total + line.unitPriceCents * line.qty, 0);

  const code = input.promoCode ? normalizePromoCode(input.promoCode) : null;
  const promoRow = code ? await db.promoCode.findUnique({ where: { code } }) : null;
  const promo = promoRow
    ? evaluatePromo({
        promo: { ...promoRow, type: promoRow.type as PromoRecord["type"] },
        subtotalCents,
        now: new Date(),
      })
    : null;

  const priced = priceCart({
    lines,
    courier: input.courier,
    discountCents: promo?.ok ? promo.discountCents : 0,
    freeShipping: promo?.ok ? promo.freeShipping : false,
  });

  const order = await db.order.create({
    data: {
      number: await uniqueOrderNumber(),
      status: "PENDING",
      email: input.email,
      name: input.name,
      address1: input.address1,
      city: input.city,
      postal: input.postal,
      country: input.country,
      courier: input.courier,
      subtotalCents: priced.subtotalCents,
      discountCents: priced.discountCents,
      shippingCents: priced.shippingCents,
      totalCents: priced.totalCents,
      promoCode: promo?.ok ? promo.code : null,
      paymentMode: input.paymentMode,
      items: {
        create: lines.map((line) => ({
          variantId: line.variantId,
          nameSnapshot: line.name,
          unitPriceCents: line.unitPriceCents,
          qty: line.qty,
        })),
      },
    },
    include: { items: true },
  });

  return order;
}

export type MarkPaidResult = {
  status: "PAID" | "ALREADY_PAID" | "CANCELLED";
  orderId: string;
  reason?: string;
};

/**
 * Marks an order paid and decrements stock in one transaction. Idempotent: a
 * repeated webhook delivery does not decrement twice.
 */
export async function markOrderPaid(orderId: string): Promise<MarkPaidResult> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new OrderError("ORDER_NOT_FOUND", "Order not found");
    if (order.status === "PAID" || order.status === "FULFILLED") {
      return { status: "ALREADY_PAID" as const, orderId: order.id };
    }
    if (order.status === "CANCELLED") {
      return { status: "CANCELLED" as const, orderId: order.id, reason: "Order was cancelled" };
    }

    for (const item of order.items) {
      if (!item.variantId) continue;
      const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
      if (!variant || variant.stock < item.qty) {
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        return {
          status: "CANCELLED" as const,
          orderId: order.id,
          reason: `Insufficient stock for ${item.nameSnapshot}`,
        };
      }
    }

    for (const item of order.items) {
      if (!item.variantId) continue;
      await tx.variant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.qty } },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });

    if (order.promoCode) {
      await tx.promoCode.updateMany({
        where: { code: order.promoCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return { status: "PAID" as const, orderId: order.id };
  });
}

export async function getOrderById(id: string) {
  return db.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function getOrderByNumber(number: string) {
  return db.order.findUnique({ where: { number }, include: { items: true } });
}
