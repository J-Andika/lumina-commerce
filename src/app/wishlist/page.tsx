"use client";

import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { useStore } from "@/components/store-provider";
import { WishlistButton } from "@/components/wishlist-button";
import { formatMoney } from "@/lib/money";

export default function WishlistPage() {
  const { wishlist, searchIndex } = useStore();
  const items = searchIndex.filter((entry) => wishlist.includes(entry.slug));

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="font-mono text-[11px] tracking-widest text-muted uppercase">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span className="text-foreground">Wishlist</span>
        </nav>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Wishlist</h1>
          <p className="font-mono text-xs text-muted">
            {items.length} {items.length === 1 ? "object" : "objects"}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 border border-hairline bg-surface p-10 text-center">
            <p className="font-display text-2xl">Nothing saved yet.</p>
            <p className="mt-2 text-sm text-muted">
              Tap the heart on any product and it stays here, on this device.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block bg-accent px-4 py-2 font-mono text-[11px] tracking-widest text-accent-foreground uppercase"
            >
              Browse objects
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((entry) => (
              <article key={entry.slug} className="group relative border border-hairline bg-surface">
                <Link href={`/product/${entry.slug}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
                    {entry.imageUrl ? (
                      <Image
                        src={entry.imageUrl}
                        alt={entry.name}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1 p-4">
                    <h2 className="font-display text-lg">{entry.name}</h2>
                    <p className="text-sm text-muted">{entry.tagline}</p>
                    <p className="font-mono text-sm tabular-nums">{formatMoney(entry.priceCents)}</p>
                  </div>
                </Link>

                <WishlistButton
                  slug={entry.slug}
                  name={entry.name}
                  className="absolute top-3 right-3"
                />
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
