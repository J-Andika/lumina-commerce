"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { useStore } from "@/components/store-provider";
import { checkCvc, checkExpiry, formatCardNumber, luhnValid } from "@/lib/card";
import { checkoutSchema, type CheckoutCourier } from "@/lib/checkout-schema";
import { formatMoney } from "@/lib/money";
import { priceCart } from "@/lib/pricing";
import { evaluatePromo } from "@/lib/promo";
import { toPricingLines } from "@/lib/cart";
import { confirmSandboxPayment, placeOrder } from "@/server/actions/checkout";
import { lookupPromo, type PublicPromo } from "@/server/actions/promo";

type Address = {
  email: string;
  name: string;
  address1: string;
  city: string;
  postal: string;
  country: string;
  courier: CheckoutCourier;
};

const EMPTY_ADDRESS: Address = {
  email: "",
  name: "",
  address1: "",
  city: "",
  postal: "",
  country: "Indonesia",
  courier: "standard",
};

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "" });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [promo, setPromo] = useState<PublicPromo | null>(null);
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!cart.promoCode) return;
    let alive = true;
    lookupPromo(cart.promoCode).then((result) => {
      if (alive && result.ok) setPromo(result.promo);
    });

    return () => {
      alive = false;
    };
  }, [cart.promoCode]);

  const lines = toPricingLines(cart);
  const subtotalCents = lines.reduce((total, line) => total + line.unitPriceCents * line.qty, 0);
  const evaluation = promo ? evaluatePromo({ promo: { ...promo, expiresAt: promo.expiresAt ? new Date(promo.expiresAt) : null }, subtotalCents }) : null;

  const priced = useMemo(
    () =>
      priceCart({
        lines,
        courier: address.courier,
        discountCents: evaluation?.ok ? evaluation.discountCents : 0,
        freeShipping: evaluation?.ok ? evaluation.freeShipping : false,
      }),
    [lines, address.courier, evaluation],
  );

  const empty = cart.items.length === 0;

  function submitAddress(event: React.FormEvent) {
    event.preventDefault();
    const parsed = checkoutSchema.safeParse({ ...address, promoCode: cart.promoCode });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!errors[key]) errors[key] = issue.message;
      }
      setAddressErrors(errors);
      return;
    }
    setAddressErrors({});
    setStep(2);
  }

  function submitCard(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!luhnValid(card.number)) errors.number = "Enter a valid card number";
    if (!card.name.trim()) errors.name = "Enter the name on the card";
    const expiry = checkExpiry(card.expiry);
    if (!expiry.valid) errors.expiry = expiry.message ?? "Invalid expiry";
    if (!checkCvc(card.cvc)) errors.cvc = "Enter a 3 or 4 digit CVC";
    setCardErrors(errors);
    if (Object.keys(errors).length === 0) setStep(3);
  }

  async function placeOrderNow() {
    setPending(true);
    setServerError(null);

    const result = await placeOrder(
      { ...address, promoCode: cart.promoCode },
      cart.items.map((item) => ({ variantId: item.variantId, qty: item.qty })),
    );

    if (!result.ok) {
      setServerError(result.message);
      setPending(false);
      return;
    }

    if (result.mode === "sandbox") {
      const confirmed = await confirmSandboxPayment(result.orderId);
      if (!confirmed.ok) {
        setServerError(confirmed.reason ?? "Payment could not be confirmed");
        setPending(false);
        return;
      }
    }

    clearCart();
    router.push(`/order/${result.orderId}`);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-widest text-muted uppercase">
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">Checkout</span>
        </nav>

        <h1 className="mt-3 font-display text-4xl tracking-tight">Checkout</h1>

        <ol className="mt-6 flex flex-wrap gap-4 font-mono text-[10px] tracking-widest uppercase">
          {["Address", "Payment", "Review"].map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const done = step > number;
            return (
              <li key={label} className={active ? "text-accent" : done ? "text-foreground" : "text-muted"}>
                {number}. {label}
                {done ? " ✓" : ""}
              </li>
            );
          })}
        </ol>

        {empty ? (
          <div className="mt-8 border border-hairline bg-surface p-10 text-center">
            <p className="font-display text-2xl">Your cart is empty.</p>
            <Link
              href="/shop"
              className="mt-5 inline-block bg-accent px-4 py-2 font-mono text-[11px] tracking-widest text-accent-foreground uppercase"
            >
              Browse objects
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              {step === 1 ? (
                <form onSubmit={submitAddress} noValidate className="space-y-4">
                  <Field label="Email" name="email" value={address.email} error={addressErrors.email}
                    onChange={(value) => setAddress((current) => ({ ...current, email: value }))} type="email" />
                  <Field label="Full name" name="name" value={address.name} error={addressErrors.name}
                    onChange={(value) => setAddress((current) => ({ ...current, name: value }))} />
                  <Field label="Address" name="address1" value={address.address1} error={addressErrors.address1}
                    onChange={(value) => setAddress((current) => ({ ...current, address1: value }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="City" name="city" value={address.city} error={addressErrors.city}
                      onChange={(value) => setAddress((current) => ({ ...current, city: value }))} />
                    <Field label="Postal code" name="postal" value={address.postal} error={addressErrors.postal}
                      onChange={(value) => setAddress((current) => ({ ...current, postal: value }))} />
                  </div>
                  <Field label="Country" name="country" value={address.country} error={addressErrors.country}
                    onChange={(value) => setAddress((current) => ({ ...current, country: value }))} />

                  <fieldset className="border border-hairline p-4">
                    <legend className="px-2 font-mono text-[10px] tracking-widest text-muted uppercase">
                      Delivery
                    </legend>
                    <div className="space-y-2">
                      {(["standard", "express"] as const).map((courier) => (
                        <label key={courier} className="flex cursor-pointer items-center justify-between gap-4 text-sm">
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="courier"
                              value={courier}
                              checked={address.courier === courier}
                              onChange={() => setAddress((current) => ({ ...current, courier }))}
                            />
                            {courier === "standard" ? "Standard — 5 to 7 days" : "Express — 2 to 3 days"}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-muted">
                            {courier === "standard" ? "$8.00" : "$18.00"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <button
                    type="submit"
                    className="w-full bg-accent px-5 py-3 font-mono text-xs tracking-widest text-accent-foreground uppercase transition-opacity hover:opacity-90"
                  >
                    Continue to payment
                  </button>
                </form>
              ) : null}

              {step === 2 ? (
                <form onSubmit={submitCard} noValidate className="space-y-4">
                  <div className="border border-accent/40 bg-surface px-4 py-3 text-xs text-muted">
                    <strong className="font-mono text-[10px] tracking-widest text-accent uppercase">
                      Sandbox payment
                    </strong>
                    <p className="mt-1">No real charge. Use 4242 4242 4242 4242, any future expiry, any CVC.</p>
                  </div>

                  <Field label="Card number" name="card-number" value={formatCardNumber(card.number)}
                    error={cardErrors.number} inputMode="numeric"
                    onChange={(value) => setCard((current) => ({ ...current, number: value }))} />
                  <Field label="Name on card" name="card-name" value={card.name} error={cardErrors.name}
                    onChange={(value) => setCard((current) => ({ ...current, name: value }))} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Expiry (MM/YY)" name="card-expiry" value={card.expiry} error={cardErrors.expiry}
                      onChange={(value) => setCard((current) => ({ ...current, expiry: value }))} />
                    <Field label="CVC" name="card-cvc" value={card.cvc} error={cardErrors.cvc}
                      onChange={(value) => setCard((current) => ({ ...current, cvc: value }))} inputMode="numeric" />
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="border border-hairline px-4 py-3 font-mono text-xs tracking-widest text-muted uppercase hover:text-foreground">
                      Back
                    </button>
                    <button type="submit" className="flex-1 bg-accent px-5 py-3 font-mono text-xs tracking-widest text-accent-foreground uppercase hover:opacity-90">
                      Review order
                    </button>
                  </div>
                </form>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <section className="border border-hairline p-4 text-sm">
                    <h2 className="font-mono text-[10px] tracking-widest text-muted uppercase">Ship to</h2>
                    <p className="mt-2">{address.name}</p>
                    <p className="text-muted">{address.address1}, {address.city} {address.postal}, {address.country}</p>
                    <p className="text-muted">{address.email}</p>
                    <button type="button" onClick={() => setStep(1)} className="mt-2 font-mono text-[10px] tracking-widest text-accent uppercase hover:underline">
                      Edit
                    </button>
                  </section>

                  <section className="border border-hairline p-4 text-sm">
                    <h2 className="font-mono text-[10px] tracking-widest text-muted uppercase">Payment</h2>
                    <p className="mt-2 text-muted">Sandbox card ending {card.number.replace(/\D/g, "").slice(-4)}</p>
                    <button type="button" onClick={() => setStep(2)} className="mt-2 font-mono text-[10px] tracking-widest text-accent uppercase hover:underline">
                      Edit
                    </button>
                  </section>

                  {serverError ? (
                    <p role="alert" className="border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
                      {serverError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={placeOrderNow}
                    disabled={pending}
                    className="w-full bg-accent px-5 py-3 font-mono text-xs tracking-widest text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? "Placing order…" : `Place order — ${formatMoney(priced.totalCents)}`}
                  </button>
                </div>
              ) : null}
            </div>

            <aside className="h-fit border border-hairline bg-surface p-4">
              <h2 className="font-mono text-[10px] tracking-widest text-muted uppercase">Order summary</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {cart.items.map((item) => (
                  <li key={item.variantId} className="flex justify-between gap-3">
                    <span className="text-muted">
                      {item.qty} × {item.productName}
                      <span className="block font-mono text-[10px] tracking-wider uppercase">{item.variantName}</span>
                    </span>
                    <span className="font-mono tabular-nums">{formatMoney(item.unitPriceCents * item.qty)}</span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-1 border-t border-hairline pt-3 text-sm">
                <Row label="Subtotal" value={formatMoney(priced.subtotalCents)} />
                {priced.discountCents > 0 ? (
                  <Row label={`Discount (${cart.promoCode})`} value={`−${formatMoney(priced.discountCents)}`} accent />
                ) : null}
                <Row label="Shipping" value={priced.shippingCents === 0 ? "Free" : formatMoney(priced.shippingCents)} />
                <Row label="Total" value={formatMoney(priced.totalCents)} strong />
              </dl>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-hairline pt-2 text-base" : ""}`}>
      <dt className={accent ? "text-accent" : "text-muted"}>{label}</dt>
      <dd className={`font-mono tabular-nums ${accent ? "text-accent" : ""}`}>{value}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label htmlFor={name} className="font-mono text-[10px] tracking-widest text-muted uppercase">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1 h-10 w-full border bg-surface px-3 text-sm ${error ? "border-red-500/60" : "border-hairline"}`}
      />
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
