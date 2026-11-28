import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { SiteHeader } from "@/components/site-header";
import { formatMoney } from "@/lib/money";
import { getOrderById } from "@/server/orders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order receipt",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const placed = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(order.createdAt);

  return (
    <div className="min-h-dvh">
      <div className="no-print">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted uppercase">Order</p>
            <h1 className="mt-1 font-display text-4xl tracking-tight">{order.number}</h1>
            <p className="mt-1 text-sm text-muted">Placed {placed}</p>
          </div>
          <span
            className={`border px-3 py-1 font-mono text-[10px] tracking-widest uppercase ${
              order.status === "PAID"
                ? "border-accent text-accent"
                : order.status === "CANCELLED"
                  ? "border-red-500/40 text-red-400"
                  : "border-hairline text-muted"
            }`}
          >
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>

        <section className="mt-8 border border-hairline">
          <h2 className="border-b border-hairline px-4 py-2 font-mono text-[10px] tracking-widest text-muted uppercase">
            Items
          </h2>
          <ul className="divide-y divide-hairline">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span>
                  {item.qty} × {item.nameSnapshot}
                </span>
                <span className="font-mono tabular-nums">
                  {formatMoney(item.unitPriceCents * item.qty)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="border border-hairline p-4 text-sm">
            <h2 className="font-mono text-[10px] tracking-widest text-muted uppercase">Ship to</h2>
            <p className="mt-2">{order.name}</p>
            <p className="text-muted">
              {order.address1}
              <br />
              {order.city} {order.postal}
              <br />
              {order.country}
            </p>
            <p className="mt-2 text-muted">{order.email}</p>
          </div>

          <dl className="space-y-1 border border-hairline p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatMoney(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 ? (
              <div className="flex justify-between text-accent">
                <dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                <dd className="font-mono tabular-nums">−{formatMoney(order.discountCents)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-mono tabular-nums">
                {order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-2 text-base">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatMoney(order.totalCents)}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <PrintButton />
            <Link
              href="/shop"
              className="no-print border border-hairline px-4 py-2 font-mono text-[11px] tracking-widest text-muted uppercase transition-colors hover:text-foreground"
            >
              Continue shopping
            </Link>
          </div>
          <p className="font-mono text-[10px] tracking-widest text-muted uppercase">
            {order.paymentMode === "sandbox" ? "Sandbox payment — no real charge" : "Stripe test mode"}
          </p>
        </div>
      </main>
    </div>
  );
}
