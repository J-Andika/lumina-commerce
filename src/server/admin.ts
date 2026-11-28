import { LOW_STOCK_THRESHOLD, canTransition, type AdminOrderStatus } from "@/lib/admin";

import { db } from "./db";
import { markOrderPaid } from "./orders";

export async function getDashboard() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [gmv, ordersToday, paidToday, lowStock, recentOrders] = await Promise.all([
    db.order.aggregate({
      _sum: { totalCents: true },
      where: { status: { in: ["PAID", "FULFILLED"] }, paidAt: { gte: start } },
    }),
    db.order.count({ where: { createdAt: { gte: start } } }),
    db.order.count({
      where: { status: { in: ["PAID", "FULFILLED"] }, paidAt: { gte: start } },
    }),
    db.variant.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD } },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
      take: 12,
      include: { product: { select: { name: true, slug: true } } },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return {
    gmvCents: gmv._sum.totalCents ?? 0,
    ordersToday,
    paidToday,
    lowStock,
    recentOrders,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  };
}

export async function updateStock(variantId: string, stock: number) {
  if (!Number.isInteger(stock) || stock < 0 || stock > 999) {
    throw new Error("Stock must be a whole number between 0 and 999");
  }

  return db.variant.update({ where: { id: variantId }, data: { stock } });
}

export async function updateOrderStatus(orderId: string, next: AdminOrderStatus) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  if (!canTransition(order.status as AdminOrderStatus, next)) {
    throw new Error(`Cannot move an order from ${order.status} to ${next}`);
  }

  if (next === "PAID") {
    return markOrderPaid(orderId);
  }

  return db.order.update({ where: { id: orderId }, data: { status: next } });
}
