"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";

import { useStore } from "@/components/store-provider";
import { toPricingLines } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { priceCart } from "@/lib/pricing";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeItem, itemCount } = useStore();

  const priced = priceCart({ lines: toPricingLines(cart), courier: "standard" });
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
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
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
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{formatMoney(priced.subtotalCents)}</dd>
                </div>
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
