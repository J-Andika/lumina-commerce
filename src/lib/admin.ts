/**
 * Admin rules that do not need a request or database: which order transitions are
 * legal and what counts as low stock.
 */

export const ORDER_STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELLED"] as const;
export type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: [],
};

export function allowedTransitions(current: AdminOrderStatus): AdminOrderStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function canTransition(from: AdminOrderStatus, to: AdminOrderStatus): boolean {
  return allowedTransitions(from).includes(to);
}

export const LOW_STOCK_THRESHOLD = 5;

export function isLowStock(stock: number, threshold = LOW_STOCK_THRESHOLD): boolean {
  return stock <= threshold;
}
