"use client";
import { useEffect, useState } from "react";
import {
  Maximize,
  Minimize,
  ChefHat,
  ShoppingBag,
  CheckCheck,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { fetchBoard } from "@/lib/orders";
import { useLiveData } from "@/hooks/use-live-data";
import { isDemo } from "@/lib/supabase/client";
export function OrderBoard() {
  const {
    data: entries,
    error,
    loading,
    connected,
  } = useLiveData(fetchBoard, "order_board");
  const [time, setTime] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [screenError, setScreenError] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }),
      );
    tick();
    const timer = setInterval(tick, 1000);
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      clearInterval(timer);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setScreenError(
        "Use your browser’s full-screen control to expand this display.",
      );
    }
  }
  const recent = (entries || []).filter(
    (e) => Date.parse(e.created_at) > Date.now() - 86400000,
  );
  const columns = [
    {
      name: "Preparing",
      hint: "Good things take a little time.",
      key: "preparing",
      icon: ChefHat,
      items: recent.filter((e) => ["placed", "preparing"].includes(e.status)),
    },
    {
      name: "Ready to collect",
      hint: "Your golden moment is here.",
      key: "ready",
      icon: ShoppingBag,
      items: recent.filter((e) => e.status === "ready"),
    },
    {
      name: "Collected",
      hint: "Enjoy every last bite.",
      key: "completed",
      icon: CheckCheck,
      items: recent
        .filter(
          (e) =>
            e.status === "completed" &&
            Date.parse(e.updated_at) > Date.now() - 15 * 60000,
        )
        .slice(-12),
    },
  ];
  return (
    <main id="main" className="order-board">
      <header className="board-header">
        <Logo />
        <div className="board-store">
          <b>Indiranagar, Bengaluru</b>
          <small>THE PICKUP COUNTER</small>
        </div>
        <div className="board-clock">
          <b>{time || "—"}</b>
          <button
            className="icon-button"
            onClick={() => void toggleFullscreen()}
            aria-label={fullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {fullscreen ? <Minimize size={21} /> : <Maximize size={21} />}
          </button>
        </div>
      </header>
      <section className="board-intro">
        <div>
          <span className="eyebrow">A LITTLE CLOSER TO DELICIOUS</span>
          <h1>Watch for your golden number.</h1>
        </div>
        <span className="connection-label">
          <i className={connected ? "green-dot" : "amber-dot"} />
          {isDemo
            ? "Demo order screen"
            : connected
              ? "Live pickup updates"
              : "Checking for updates"}
        </span>
      </section>
      {(error || screenError) && (
        <p className="error-box" role="alert">
          {error
            ? `Updates unavailable. Displayed tokens may be out of date. ${error}`
            : screenError}
        </p>
      )}
      <div className="board-columns" aria-live="polite" aria-atomic="false">
        {columns.map((column) => {
          const Icon = column.icon;
          return (
            <section
              key={column.key}
              className={`board-column board-${column.key}`}
            >
              <div className="board-column-title">
                <span>
                  <Icon size={25} />
                </span>
                <div>
                  <h2>{column.name}</h2>
                  <p>{column.hint}</p>
                </div>
                <b>{column.items.length}</b>
              </div>
              <div className="token-grid">
                {column.items.map((entry) => (
                  <div className="board-token" key={entry.order_id}>
                    {entry.token}
                    {column.key === "ready" && (
                      <small>
                        COME ON OVER <ArrowUpRight size={12} />
                      </small>
                    )}
                  </div>
                ))}
              </div>
              {column.items.length === 0 && (
                <div className="board-empty">
                  <Icon size={40} strokeWidth={1.1} />
                  <p>
                    {loading
                      ? "Loading tokens…"
                      : column.key === "preparing"
                        ? "The kitchen is all caught up."
                        : column.key === "ready"
                          ? "Fresh orders will appear here."
                          : "Collected orders appear for 15 minutes."}
                  </p>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <footer className="board-footer">
        <span>
          Token turned green? <b>Collect your order at the counter.</b>
        </span>
        <span>
          {isDemo ? (
            <Link href="/dashboard">
              Try the staff dashboard <ArrowUpRight size={14} />
            </Link>
          ) : (
            "Thank you for making it Golden Bite."
          )}
        </span>
      </footer>
    </main>
  );
}
