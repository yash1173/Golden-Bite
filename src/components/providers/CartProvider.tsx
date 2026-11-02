"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Fulfillment, Product } from "@/lib/types";
import { fetchMenu, fetchSettings } from "@/lib/orders";
import { defaultSettings, type OrderSettings } from "@/lib/config";
import { cartSubtotal } from "@/lib/utils";

interface CartContextValue {
  items: CartItem[];
  mode: Fulfillment;
  products: Product[];
  menuLoading: boolean;
  menuError: string;
  settings: OrderSettings;
  setMode: (mode: Fulfillment) => void;
  add: (id: string) => void;
  quantity: (id: string, amount: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  drawer: boolean;
  setDrawer: (open: boolean) => void;
  hydrated: boolean;
}
const CartContext = createContext<CartContextValue | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<Fulfillment>("pickup");
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<OrderSettings>(defaultSettings);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("golden-bite-bag") ?? "{}");
      if (Array.isArray(saved.items))
        setItems(
          saved.items.filter(
            (i: CartItem) =>
              typeof i.productId === "string" &&
              Number.isInteger(i.quantity) &&
              i.quantity > 0 &&
              i.quantity <= 20,
          ),
        );
      if (saved.mode === "delivery") setMode("delivery");
    } catch {
      /* A corrupt saved bag starts empty. */
    }
    setHydrated(true);
    let mounted = true;
    Promise.all([fetchMenu(), fetchSettings()])
      .then(([products, settings]) => {
        if (mounted) {
          setProducts(products);
          setSettings(settings);
        }
      })
      .catch((e) => {
        if (mounted) setMenuError(e.message);
      })
      .finally(() => {
        if (mounted) setMenuLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem("golden-bite-bag", JSON.stringify({ items, mode }));
  }, [items, mode, hydrated]);
  function quantity(id: string, amount: number) {
    setItems((current) =>
      amount <= 0
        ? current.filter((i) => i.productId !== id)
        : current.some((i) => i.productId === id)
          ? current.map((i) =>
              i.productId === id ? { ...i, quantity: Math.min(20, amount) } : i,
            )
          : [...current, { productId: id, quantity: Math.min(20, amount) }],
    );
  }
  function add(id: string) {
    setItems((current) =>
      current.some((i) => i.productId === id)
        ? current.map((i) =>
            i.productId === id
              ? { ...i, quantity: Math.min(20, i.quantity + 1) }
              : i,
          )
        : [...current, { productId: id, quantity: 1 }],
    );
  }
  return (
    <CartContext.Provider
      value={{
        items,
        mode,
        products,
        settings,
        menuLoading,
        menuError,
        setMode,
        add,
        quantity,
        clear: () => setItems([]),
        count: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal: cartSubtotal(items, products),
        drawer,
        setDrawer,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider is required.");
  return value;
}
