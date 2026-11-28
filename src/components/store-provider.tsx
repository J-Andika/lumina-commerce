"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  EMPTY_CART,
  cartCount,
  cartReducer,
  type CartItem,
  type CartState,
} from "@/lib/cart";

const CART_KEY = "lumina.cart.v1";
const WISHLIST_KEY = "lumina.wishlist.v1";

type Toast = {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
};

type StoreValue = {
  cart: CartState;
  itemCount: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  wishlist: string[];
  wishlistCount: number;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  toasts: Toast[];
  pushToast: (message: string, action?: Toast["action"]) => void;
  dismissToast: (id: number) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function readCart(): CartState {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw) as CartState;

    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      promoCode: parsed.promoCode ?? null,
    };
  } catch {
    return EMPTY_CART;
  }
}

/* --- wishlist: external store so hydration never calls setState in an effect --- */

const EMPTY_WISHLIST: string[] = [];
const wishlistListeners = new Set<() => void>();
let wishlistCache: string[] | null = null;

function readWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];

    return Array.isArray(parsed)
      ? parsed.filter((slug): slug is string => typeof slug === "string")
      : [];
  } catch {
    return EMPTY_WISHLIST;
  }
}

function getWishlistSnapshot(): string[] {
  if (wishlistCache === null) wishlistCache = readWishlist();

  return wishlistCache;
}

function getWishlistServerSnapshot(): string[] {
  return EMPTY_WISHLIST;
}

function subscribeWishlist(listener: () => void) {
  wishlistListeners.add(listener);

  function onStorage(event: StorageEvent) {
    if (event.key !== WISHLIST_KEY) return;
    wishlistCache = null;
    listener();
  }

  window.addEventListener("storage", onStorage);

  return () => {
    wishlistListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function writeWishlist(next: string[]) {
  wishlistCache = next;

  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  } catch {
    // storage can be blocked; the in-memory list still works
  }

  for (const listener of wishlistListeners) listener();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const hydrated = useRef(false);

  const wishlist = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getWishlistServerSnapshot,
  );

  useEffect(() => {
    dispatch({ type: "hydrate", state: readCart() });
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;

    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message: string, action?: Toast["action"]) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-2), { id, message, action }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 6000);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    dispatch({ type: "add", item, qty });
    setCartOpen(true);
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    dispatch({ type: "setQty", variantId, qty });
  }, []);

  const removeItem = useCallback(
    (variantId: string) => {
      const removed = cart.items.find((item) => item.variantId === variantId);
      dispatch({ type: "remove", variantId });

      if (removed) {
        pushToast(`Removed ${removed.productName}`, {
          label: "Undo",
          run: () => dispatch({ type: "add", item: removed, qty: removed.qty }),
        });
      }
    },
    [cart.items, pushToast],
  );

  const clearCart = useCallback(() => dispatch({ type: "clear" }), []);

  const toggleWishlist = useCallback((slug: string) => {
    const current = getWishlistSnapshot();
    writeWishlist(
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      cart,
      itemCount: cartCount(cart),
      addItem,
      setQty,
      removeItem,
      clearCart,
      cartOpen,
      setCartOpen,
      wishlist,
      wishlistCount: wishlist.length,
      toggleWishlist,
      isWishlisted: (slug: string) => wishlist.includes(slug),
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      cart,
      addItem,
      setQty,
      removeItem,
      clearCart,
      cartOpen,
      wishlist,
      toggleWishlist,
      toasts,
      pushToast,
      dismissToast,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");

  return context;
}
