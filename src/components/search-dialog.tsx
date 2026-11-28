"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useStore } from "@/components/store-provider";
import { formatMoney } from "@/lib/money";
import { filterSearchIndex } from "@/lib/search";

export function SearchDialog() {
  const { searchIndex, searchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  const results = filterSearchIndex(searchIndex, query);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Chrome reserves ⌘K/Ctrl+K for its own search bar, so "/" is the shortcut
      // that actually reaches the page in every browser.
      if (event.key === "/" && !typing) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen]);

  function go(slug: string) {
    setSearchOpen(false);
    setQuery("");
    setActive(0);
    router.push(`/product/${slug}`);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const first = results[active];
      if (first) {
        go(first.slug);
      } else if (query.trim()) {
        setSearchOpen(false);
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      }
    }
  }

  return (
    <Dialog.Root
      open={searchOpen}
      onOpenChange={(open) => {
        setSearchOpen(open);
        if (!open) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-[12vh] left-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 border border-hairline bg-background shadow-2xl">
          <Dialog.Title className="sr-only">Search products</Dialog.Title>

          <div className="border-b border-hairline p-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Search objects…"
              aria-label="Search products"
              className="h-10 w-full bg-transparent px-2 text-base placeholder:text-muted focus:outline-none"
            />
          </div>

          {query.trim() ? (
            results.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Search results">
                {results.map((entry, index) => (
                  <li key={entry.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === active}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(entry.slug)}
                      className={`flex w-full items-center gap-3 px-2 py-2 text-left ${
                        index === active ? "bg-surface-2" : ""
                      }`}
                    >
                      <span className="relative h-12 w-10 shrink-0 overflow-hidden border border-hairline bg-surface-2">
                        {entry.imageUrl ? (
                          <Image src={entry.imageUrl} alt="" fill unoptimized sizes="40px" className="object-cover" />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm">{entry.name}</span>
                        <span className="block truncate font-mono text-[10px] tracking-wider text-muted uppercase">
                          {entry.category}
                        </span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-muted">
                        {formatMoney(entry.priceCents)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted">
                Nothing matches “{query}”. Press Enter to search the catalogue instead.
              </p>
            )
          ) : (
            <p className="p-4 font-mono text-[10px] tracking-widest text-muted uppercase">
              Type to search · ↑↓ to move · Enter to open · Esc to close
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
