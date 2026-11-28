"use client";

import { Heart } from "lucide-react";

import { useStore } from "@/components/store-provider";

export function WishlistButton({
  slug,
  name,
  className = "",
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist, pushToast } = useStore();
  const active = isWishlisted(slug);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlist(slug);
        pushToast(active ? `Removed ${name} from wishlist` : `Saved ${name} to wishlist`);
      }}
      className={`grid size-8 place-items-center border border-hairline bg-background/80 backdrop-blur transition-colors hover:text-accent ${className}`}
    >
      <Heart className={`size-4 ${active ? "fill-accent text-accent" : ""}`} aria-hidden />
    </button>
  );
}
