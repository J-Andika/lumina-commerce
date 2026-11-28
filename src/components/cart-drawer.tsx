"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useEffect, useState } from "react";

import { useStore } from "@/components/store-provider";
import { toPricingLines } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_CENTS, priceCart } from "@/lib/pricing";
import { evaluatePromo } from "@/lib/promo";
import { lookupPromo, type PublicPromo } from "@/server/actions/promo";

type PromoState = { code: string | null; promo: PublicPromo | null; error: string | null };

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeItem, itemCount, setPromoCode } = useStore();
  const [promoState, setPromoState] = useState<PromoState>({ code: null, promo: null, error: null });
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    const code = cart.promoCode;
    if (!code) return;

    let alive = true;
    lookupPromo(code).then((result) => {
      if (!alive) return;
      setPromoState(
        result.ok
          ? { code, promo: result.promo, error: null }
          : { code, promo: null, error: "That code does not exist" },
      );
    });

    return () => {
      alive = false;
    };
  }, [cart.promoCode]);

  const promo = promoState.code === cart.promoCode ? promoState.promo : null;
  const lines = toPricingLines(cart);
  const subtotalCents = lines.reduce((total, line) => total + line.unitPriceCents * line.qty, 0);

  const evaluation = promo
    ? evaluatePromo({
        promo: {
          ...promo,
          expiresAt: promo.expiresAt ? new Date(promo.expiresAt) : null,
        },
        subtotalCents,
      })
    : null;

  const priced = priceCart({
    lines,
    courier: "standard",
    discountCents: evaluation?.ok ? evaluation.discountCents : 0,
    freeShipping: evaluation?.ok ? evaluation.freeShipping : false,
  });

  const postDiscount = priced.subtotalCents - priced.discountCents;
  const progress = Math.max(
    0,
    Math.min(100, Math.round((postDiscount / FREE_SHIPPING_THRESHOLD_CENTS) * 100)),
  );
  const empty = cart.items.length === 0;

  return (
    <Dialog.Root open={cartOpen} onOpenChange={setCartOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-hairline bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <Dialog.Title className="font-display text-xl">
              Cart {itemCount > 0 ? <span className="font-mono text-sm text-muted">({itemCount})</span> : null}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close cart"
              className="grid size-8 place-items-center border border-hairline text-muted hover:text-foreground"
            >
              ×
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {empty ? (
              <div className="py-16 text-center">
                <p className="font-display text-2xl">Your cart is empty.</p>
                <p className="mt-2 text-sm text-muted">Objects you add land here, saved across reloads.</p>
                <Dialog.Close className="mt-6 inline-block border border-hairline px-4 py-2 font-mono text-[11px] tracking-widest text-muted uppercase hover:text-foreground">
                  Browse objects
                </Dialog.Close>
              </div>
            ) : (
              <ul className="space-y-4">
                {cart.items.map((item) => (
                  <li key={item.variantId} className="flex gap-3 border-b border-hairline pb-4 last:border-0">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-hairline bg-surface-2">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill unoptimized sizes="80px" className="object-cover" />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-base leading-tight">{item.productName}</p>
                          <p className="mt-0.5 font-mono text-[11px] tracking-wider text-muted uppercase">
                            {item.variantName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="font-mono text-[10px] tracking-widest text-muted uppercase hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center border border-hairline">
                          <button
                            type="button"
                            onClick={() => setQty(item.variantId, item.qty - 1)}
                            aria-label={`Decrease quantity of ${item.productName}`}
                            className="size-8 text-muted hover:text-foreground"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-mono text-sm tabular-nums" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item.variantId, item.qty + 1)}
                            aria-label={`Increase quantity of ${item.productName}`}
                            className="size-8 text-muted hover:text-foreground"
                          >
                            +
                          </button>
                        </div>
                        <p className="font-mono text-sm tabular-nums">
                          {formatMoney(item.unitPriceCents * item.qty)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {empty ? null : (
            <div className="border-t border-hairline px-5 py-4">
              <div className="mb-4">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-muted uppercase">
                  <span>Free shipping at {formatMoney(FREE_SHIPPING_THRESHOLD_CENTS)}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-surface-2" aria-hidden>
                  <div
                    className="h-full bg-accent transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted" aria-live="polite">
                  {priced.freeShippingRemainingCents === 0
                    ? "Free shipping unlocked."
                    : `Add ${formatMoney(priced.freeShippingRemainingCents)} for free shipping.`}
                </p>
              </div>

              <form
                className="mb-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const code = codeInput.trim();
                  if (!code) return;
                  setPromoState({ code, promo: null, error: null });
                  setPromoCode(code);
                }}
              >
                <label htmlFor="promo-code" className="sr-only">
                  Promo code
                </label>
                <input
                  id="promo-code"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  placeholder="Promo code"
                  className="h-9 flex-1 border border-hairline bg-surface px-3 font-mono text-xs tracking-wider uppercase placeholder:text-muted"
                />
                <button
                  type="submit"
                  className="h-9 border border-hairline px-3 font-mono text-[11px] tracking-widest text-muted uppercase hover:text-foreground"
                >
                  Apply
                </button>
              </form>

              {cart.promoCode ? (
                <div className="mb-3 flex items-start justify-between gap-3 border border-hairline px-3 py-2 text-xs">
                  <div>
                    <p className="font-mono tracking-widest uppercase">{cart.promoCode}</p>
                    <p className={evaluation?.ok ? "text-accent" : "text-muted"}>
                      {evaluation?.ok
                        ? evaluation.label
                        : (promoState.error ?? evaluation?.message ?? "Checking code…")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPromoCode(null);
                      setPromoState({ code: null, promo: null, error: null });
                      setCodeInput("");
                    }}
                    className="font-mono text-[10px] tracking-widest text-muted uppercase hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              ) : null}

              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatMoney(priced.subtotalCents)}</dd>
                </div>
                {priced.discountCents > 0 ? (
                  <div className="flex justify-between text-accent">
                    <dt>Discount</dt>
                    <dd className="font-mono tabular-nums">−{formatMoney(priced.discountCents)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping (standard)</dt>
                  <dd className="font-mono tabular-nums">
                    {priced.shippingCents === 0 ? "Free" : formatMoney(priced.shippingCents)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-hairline pt-2 text-base">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums">{formatMoney(priced.totalCents)}</dd>
                </div>
              </dl>

              <button
                type="button"
                disabled
                title="Checkout lands in stage 7"
                className="mt-4 w-full cursor-not-allowed border border-hairline bg-surface px-4 py-3 font-mono text-xs tracking-widest text-muted uppercase"
              >
                Checkout — stage 7
              </button>
              <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-muted uppercase">
                Totals re-checked on the server at checkout
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
