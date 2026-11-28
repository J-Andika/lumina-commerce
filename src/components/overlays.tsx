"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { useStore } from "@/components/store-provider";

const CartDrawer = dynamic(() => import("@/components/cart-drawer").then((mod) => mod.CartDrawer), {
  ssr: false,
});
const SearchDialog = dynamic(
  () => import("@/components/search-dialog").then((mod) => mod.SearchDialog),
  { ssr: false },
);

/**
 * Radix dialogs and the search list are only needed after an interaction, so they
 * are code-split and mounted on demand. The "/" shortcut lives here because it
 * must work before the dialog exists.
 */
export function Overlays() {
  const { cartOpen, searchOpen, setSearchOpen } = useStore();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (event.key === "/" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen]);

  return (
    <>
      {cartOpen ? <CartDrawer /> : null}
      {searchOpen ? <SearchDialog /> : null}
    </>
  );
}
