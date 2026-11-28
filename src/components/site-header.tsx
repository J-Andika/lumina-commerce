"use client";

import Link from "next/link";

import { useStore } from "@/components/store-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { label: "Audio", href: "/shop?category=audio" },
  { label: "Workspace", href: "/shop?category=workspace" },
  { label: "Accessories", href: "/shop?category=accessories" },
];

export function SiteHeader() {
  const { itemCount, setCartOpen, wishlistCount } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" className="font-display text-xl tracking-tight">
          Lumina
        </Link>

        <nav className="hidden gap-5 text-sm text-muted md:flex" aria-label="Categories">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <form action="/shop" method="get" role="search" className="ml-auto hidden sm:block">
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            placeholder="Search"
            className="h-9 w-40 border border-hairline bg-surface px-3 text-sm placeholder:text-muted focus:w-56 focus:outline-none md:w-56"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          <span
            title="Wishlist page lands in the next stage-6 slice"
            className="hidden h-9 items-center gap-2 border border-hairline px-3 font-mono text-[11px] tracking-widest text-muted uppercase sm:flex"
          >
            Wishlist <span className={wishlistCount > 0 ? "text-accent" : ""}>{wishlistCount}</span>
          </span>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${itemCount} items`}
            className="flex h-9 items-center gap-2 border border-hairline px-3 font-mono text-[11px] tracking-widest text-muted uppercase transition-colors hover:text-foreground"
          >
            Cart <span className={itemCount > 0 ? "text-accent" : ""}>{itemCount}</span>
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
