"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeOrders } from "@/lib/orders";

export function useLiveData<T>(
  loader: () => Promise<T>,
  table: "orders" | "order_board" = "orders",
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const alive = useRef(false);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const result = await loader();
      if (alive.current && request === version.current) {
        setData(result);
        setError("");
      }
    } catch (e) {
      if (alive.current && request === version.current)
        setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    alive.current = true;
    void refresh();
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeOrders(table, () => void refresh(), setConnected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed.");
    }
    // Polling also catches reconnects, expired board entries, and missed events.
    const interval = setInterval(() => void refresh(), 10000);
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      version.current++;
      unsubscribe?.();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, table]);
  return { data, error, connected: connected && !error, loading, refresh };
}
