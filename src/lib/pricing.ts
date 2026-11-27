/**
 * Pure pricing domain. Everything is integer cents; the client never sets a total.
 * This function is the single source of truth for cart display, checkout, and the
 * Stripe webhook, so it must stay free of I/O and database imports.
 */

export const COURIERS = ["standard", "express"] as const;
export type Courier = (typeof COURIERS)[number];

export const SHIPPING_RATES_CENTS: Record<Courier, number> = {
  standard: 800,
  express: 1800,
};

export const FREE_SHIPPING_THRESHOLD_CENTS = 10_000;
export const TAX_CENTS = 0;
export const MAX_QTY_PER_LINE = 10;

export type PricingLine = {
  variantId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  stock: number;
};

export type PricingInput = {
  lines: PricingLine[];
  courier: Courier;
  /** Absolute discount already resolved by the promo engine. */
  discountCents?: number;
  /** Set by a FREESHIP promo; also implied at the threshold. */
  freeShipping?: boolean;
};

export type PricingResult = {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  /** Fixed at 0 for the demo and reported explicitly rather than omitted. */
  taxCents: number;
  totalCents: number;
  freeShippingRemainingCents: number;
};

export type PricingErrorCode =
  | "INVALID_LINE"
  | "INVALID_QTY"
  | "QTY_EXCEEDS_STOCK"
  | "INVALID_PRICE"
  | "UNKNOWN_COURIER"
  | "INVALID_DISCOUNT";

export class PricingError extends Error {
  readonly code: PricingErrorCode;

  constructor(code: PricingErrorCode, message: string) {
    super(message);
    this.name = "PricingError";
    this.code = code;
  }
}

function assertLine(line: PricingLine): void {
  if (!line.variantId) {
    throw new PricingError("INVALID_LINE", "A pricing line needs a variant id");
  }
  if (!Number.isInteger(line.qty) || line.qty < 1) {
    throw new PricingError("INVALID_QTY", `Quantity must be a positive integer, received ${line.qty}`);
  }
  if (line.qty > line.stock) {
    throw new PricingError(
      "QTY_EXCEEDS_STOCK",
      `Quantity ${line.qty} exceeds stock ${line.stock} for ${line.name}`,
    );
  }
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new PricingError(
      "INVALID_PRICE",
      `Unit price must be a non-negative integer, received ${line.unitPriceCents}`,
    );
  }
}

export function priceCart(input: PricingInput): PricingResult {
  if (!COURIERS.includes(input.courier)) {
    throw new PricingError("UNKNOWN_COURIER", `Unknown courier: ${String(input.courier)}`);
  }

  const discountInput = input.discountCents ?? 0;
  if (!Number.isInteger(discountInput) || discountInput < 0) {
    throw new PricingError(
      "INVALID_DISCOUNT",
      `Discount must be a non-negative integer, received ${discountInput}`,
    );
  }

  let subtotalCents = 0;
  for (const line of input.lines) {
    assertLine(line);
    subtotalCents += line.unitPriceCents * line.qty;
  }

  if (!Number.isInteger(subtotalCents)) {
    throw new PricingError("INVALID_PRICE", "Subtotal drifted off integer cents");
  }

  const discountCents = Math.min(discountInput, subtotalCents);
  const postDiscountCents = subtotalCents - discountCents;

  const qualifiesForFreeShipping =
    Boolean(input.freeShipping) || postDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS;

  const shippingCents =
    subtotalCents === 0 || qualifiesForFreeShipping ? 0 : SHIPPING_RATES_CENTS[input.courier];

  const totalCents = postDiscountCents + shippingCents + TAX_CENTS;

  return {
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents: TAX_CENTS,
    totalCents,
    freeShippingRemainingCents:
      subtotalCents === 0 || qualifiesForFreeShipping
        ? 0
        : Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - postDiscountCents),
  };
}
