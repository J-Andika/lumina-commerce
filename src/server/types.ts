export const ORDER_STATUSES = ["PENDING", "PAID", "FULFILLED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PROMO_TYPES = ["PERCENT", "FIXED", "FREESHIP"] as const;
export type PromoType = (typeof PROMO_TYPES)[number];

export const CATEGORIES = ["audio", "workspace", "accessories"] as const;
export type Category = (typeof CATEGORIES)[number];

export const COURIERS = ["standard", "express"] as const;
export type Courier = (typeof COURIERS)[number];
