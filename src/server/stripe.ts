import Stripe from "stripe";

import { db } from "./db";

export type PaymentsMode = "stripe" | "sandbox";

/**
 * Stripe is optional. Without PAYMENTS_MODE=stripe and a secret key the app runs
 * in sandbox mode: a local authorisation with an explicit badge, no real charge.
 */
export function paymentsMode(): PaymentsMode {
  return process.env.PAYMENTS_MODE === "stripe" && process.env.STRIPE_SECRET_KEY
    ? "stripe"
    : "sandbox";
}

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (paymentsMode() !== "stripe") return null;
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY as string);

  return client;
}

export async function createPaymentIntentForOrder(order: {
  id: string;
  number: string;
  totalCents: number;
}) {
  const stripe = getStripe();
  if (!stripe) return null;

  const intent = await stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: "usd",
    metadata: { orderId: order.id, orderNumber: order.number },
    automatic_payment_methods: { enabled: true },
  });

  await db.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  });

  return { id: intent.id, clientSecret: intent.client_secret };
}
