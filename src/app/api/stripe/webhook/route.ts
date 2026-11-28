import { headers } from "next/headers";
import type Stripe from "stripe";

import { db } from "@/server/db";
import { markOrderPaid } from "@/server/orders";
import { getStripe } from "@/server/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return Response.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing signature" }, { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId =
      intent.metadata.orderId ??
      (await db.order.findUnique({ where: { stripePaymentIntentId: intent.id } }))?.id;

    if (orderId) {
      await markOrderPaid(orderId);
    }
  }

  return Response.json({ received: true });
}
