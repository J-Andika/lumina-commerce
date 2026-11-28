"use server";

import { cartSchema, checkoutSchema, formatCheckoutErrors } from "@/lib/checkout-schema";

import { createOrder, markOrderPaid, OrderError } from "../orders";
import { createPaymentIntentForOrder, paymentsMode } from "../stripe";

export type PlaceOrderResult =
  | {
      ok: true;
      orderId: string;
      number: string;
      totalCents: number;
      mode: "stripe" | "sandbox";
      clientSecret: string | null;
    }
  | {
      ok: false;
      error: string;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function placeOrder(addressInput: unknown, itemsInput: unknown): Promise<PlaceOrderResult> {
  const cart = cartSchema.safeParse(itemsInput);
  if (!cart.success) {
    return { ok: false, error: "INVALID_CART", message: "Your cart is empty or invalid." };
  }

  const address = checkoutSchema.safeParse(addressInput);
  if (!address.success) {
    return {
      ok: false,
      error: "INVALID_ADDRESS",
      message: "Please check the highlighted fields.",
      fieldErrors: formatCheckoutErrors(address.error),
    };
  }

  const mode = paymentsMode();

  try {
    const order = await createOrder({
      ...address.data,
      items: cart.data,
      paymentMode: mode,
    });

    if (mode === "stripe") {
      const intent = await createPaymentIntentForOrder(order);

      return {
        ok: true,
        orderId: order.id,
        number: order.number,
        totalCents: order.totalCents,
        mode,
        clientSecret: intent?.clientSecret ?? null,
      };
    }

    return {
      ok: true,
      orderId: order.id,
      number: order.number,
      totalCents: order.totalCents,
      mode: "sandbox",
      clientSecret: null,
    };
  } catch (error) {
    if (error instanceof OrderError) {
      return { ok: false, error: error.code, message: error.message };
    }
    throw error;
  }
}

export async function confirmSandboxPayment(orderId: string) {
  if (paymentsMode() !== "sandbox") {
    return { ok: false as const, error: "Stripe orders are confirmed by webhook" };
  }

  const result = await markOrderPaid(orderId);

  return {
    ok: result.status === "PAID" || result.status === "ALREADY_PAID",
    status: result.status,
    reason: result.reason ?? null,
  };
}
