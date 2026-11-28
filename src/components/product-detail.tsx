"use client";

import Image from "next/image";
import { useState } from "react";

import { useStore } from "@/components/store-provider";
import { WishlistButton } from "@/components/wishlist-button";
import { formatMoney } from "@/lib/money";
import { stockLabel, type VariantView } from "@/lib/product-view";

type GalleryImage = { id: string; url: string; alt: string };

type Props = {
  productSlug: string;
  productName: string;
  images: GalleryImage[];
  variants: VariantView[];
  initialVariantId: string | null;
};

export function ProductDetail({
  productSlug,
  productName,
  images,
  variants,
  initialVariantId,
}: Props) {
  const { addItem } = useStore();
  const [activeImageId, setActiveImageId] = useState(images[0]?.id ?? null);
  const [selectedId, setSelectedId] = useState(initialVariantId);

  const activeImage = images.find((image) => image.id === activeImageId) ?? images[0];
  const selected = variants.find((variant) => variant.id === selectedId) ?? null;
  const fallbackPrice = variants.length > 0 ? Math.min(...variants.map((v) => v.priceCents)) : 0;
  const price = selected?.priceCents ?? fallbackPrice;
  const stock = selected?.stock ?? 0;
  const label = stockLabel(stock);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="relative aspect-[4/5] overflow-hidden border border-hairline bg-surface-2">
          {activeImage ? (
            <Image
              key={activeImage.id}
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              unoptimized
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Product images">
            {images.map((image, index) => {
              const active = image.id === activeImage?.id;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveImageId(image.id)}
                  aria-pressed={active}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                  className={`relative aspect-square overflow-hidden border transition-colors ${
                    active ? "border-accent" : "border-hairline hover:border-muted"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 18vw, 30vw"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs tracking-widest text-muted uppercase">Choose a variant</p>
          <WishlistButton slug={productSlug} name={productName} />
        </div>

        <fieldset className="mt-3">
          <legend className="sr-only">Variants of {productName}</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const soldOut = variant.stock === 0;
              const active = variant.id === selectedId;

              return (
                <label
                  key={variant.id}
                  className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm transition-colors ${
                    active ? "border-accent text-foreground" : "border-hairline text-muted"
                  } ${soldOut ? "cursor-not-allowed opacity-50" : "hover:text-foreground"}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={variant.id}
                    checked={active}
                    disabled={soldOut}
                    onChange={() => setSelectedId(variant.id)}
                    className="sr-only"
                  />
                  {variant.colorHex ? (
                    <span
                      aria-hidden
                      className="size-3 rounded-full border border-hairline"
                      style={{ backgroundColor: variant.colorHex }}
                    />
                  ) : null}
                  <span>{variant.name}</span>
                  <span className="font-mono text-xs tabular-nums">
                    {formatMoney(variant.priceCents)}
                  </span>
                  {soldOut ? <span className="font-mono text-[10px] uppercase">sold out</span> : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex items-baseline gap-3">
          <p className="font-mono text-2xl tabular-nums" aria-live="polite">
            {formatMoney(price)}
          </p>
          <p className={`font-mono text-[11px] tracking-widest uppercase ${label.tone === "accent" ? "text-accent" : "text-muted"}`}>
            {label.text}
          </p>
        </div>

        <button
          type="button"
          disabled={!selected || selected.stock === 0}
          onClick={() => {
            if (!selected) return;
            addItem(
              {
                variantId: selected.id,
                productSlug,
                productName,
                variantName: selected.name,
                unitPriceCents: selected.priceCents,
                stock: selected.stock,
                imageUrl: images[0]?.url,
              },
              1,
            );
          }}
          className="mt-6 w-full border border-accent bg-accent px-5 py-3 font-mono text-xs tracking-widest text-accent-foreground uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-hairline disabled:bg-surface disabled:text-muted"
        >
          {selected && selected.stock === 0 ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
