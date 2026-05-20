"use client";
import { useState, useEffect, useCallback } from "react";
import type { CartItem } from "@/types";

const CART_KEY = "revora_cart";
const CART_EVENT = "cart-updated";

/**
 * useCart — encapsulates all cart state and localStorage sync.
 * No more inline JSON.parse/stringify in every component.
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  // Sync from storage on mount and on cross-tab updates
  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem(CART_KEY);
        setItems(stored ? JSON.parse(stored) : []);
      } catch { setItems([]); }
    };
    load();
    window.addEventListener(CART_EVENT, load);
    return () => window.removeEventListener(CART_EVENT, load);
  }, []);

  const persist = (next: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    setItems(next);
    window.dispatchEvent(new Event(CART_EVENT));
  };

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CART_KEY);
    const prev: CartItem[] = stored ? JSON.parse(stored) : [];
    const existing = prev.find((i) => i.id === item.id);
    const next = existing
      ? prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity ?? 1) } : i)
      : [...prev, { ...item, quantity: item.quantity ?? 1 }];
    persist(next);
  }, []);

  const removeItem = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CART_KEY);
    const prev: CartItem[] = stored ? JSON.parse(stored) : [];
    const next = prev.filter((i) => i.id !== id);
    persist(next);
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CART_KEY);
    const prev: CartItem[] = stored ? JSON.parse(stored) : [];
    const next = qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => i.id === id ? { ...i, quantity: qty } : i);
    persist(next);
  }, []);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CART_KEY);
    setItems([]);
    window.dispatchEvent(new Event(CART_EVENT));
  }, []);

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const count = items.reduce((acc, i) => acc + i.quantity, 0);

  return { items, total, count, addItem, removeItem, updateQuantity, clear };
}
