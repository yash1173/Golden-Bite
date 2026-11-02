"use client";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChefHat,
  CheckCheck,
  ShoppingBag,
  IndianRupee,
  ArrowUpRight,
  Search,
  Store,
  Truck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { fetchOrders, changeStatus } from "@/lib/orders";
import { money, nextStatus, statusLabels, timeAgo } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isDemo } from "@/lib/supabase/client";
const filters = [
  "Active",
  "All",
  "Pickup",
  "Delivery",
  "Completed",
  "Cancelled",
] as const;
type Filter = (typeof filters)[number];
function OrderCard({
  order,
  onRefresh,
}: {
  order: Order;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = nextStatus(order.status, order.fulfillment);
  const actions: Partial<Record<OrderStatus, string>> = {
    preparing: "Start preparing",
    ready: "Mark ready to collect",
    out_for_delivery: "Send out for delivery",
    completed:
      order.fulfillment === "pickup" ? "Mark collected" : "Mark delivered",
  };
  async function update(status: OrderStatus) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await changeStatus(order.id, status);
      setConfirmCancel(false);
      onRefresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Update failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="staff-order">
      <div className="staff-order-top">
        <div>
          <strong>{order.token}</strong>
          <span>
            {order.fulfillment === "pickup" ? (
              <Store size={14} />
            ) : (
              <Truck size={14} />
            )}
            {order.fulfillment === "pickup" ? "Pickup" : "Delivery"}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="staff-customer">
        <b>{order.customer_name}</b>
        <a href={`tel:${order.phone}`}>{order.phone}</a>
        <small>{timeAgo(order.created_at)}</small>
      </div>
      <div className="staff-items">
        {order.items.map((item, i) => (
          <div key={i}>
            <b>{item.quantity}×</b>
            <span>{item.name}</span>
            <span>{money(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>
      {order.address && (
        <div className="staff-address">
          <Truck size={15} />
          <span>
            {order.address}, {order.postcode}
          </span>
        </div>
      )}
      {order.notes && (
        <p className="staff-note">
          <b>Kitchen note:</b> {order.notes}
        </p>
      )}
      <div className="staff-order-total">
        <span>
          {order.fulfillment === "pickup"
            ? "Pay at counter"
            : "Cash on delivery"}
        </span>
        <b>{money(order.total)}</b>
      </div>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      {next && (
        <button
          className="button button-dark full-width"
          disabled={busy}
          onClick={() => void update(next)}
        >
          {busy ? "Updating…" : actions[next]}
          <ArrowRight size={17} />
        </button>
      )}
      {["placed", "preparing"].includes(order.status) && (
        <div className="cancel-controls">
          {confirmCancel ? (
            <>
              <span>Cancel this order?</span>
              <button disabled={busy} onClick={() => void update("cancelled")}>
                Yes, cancel
              </button>
              <button onClick={() => setConfirmCancel(false)}>
                Keep order
              </button>
            </>
          ) : (
            <button disabled={busy} onClick={() => setConfirmCancel(true)}>
              Cancel order
            </button>
          )}
        </div>
      )}
    </article>
  );
}
export function Dashboard() {
  const loader = useCallback(() => fetchOrders("staff"), []);
  const {
    data: orders,
    error,
    loading,
    connected,
    refresh,
  } = useLiveData(loader);
  const [filter, setFilter] = useState<Filter>("Active");
  const [search, setSearch] = useState("");
  const active = (orders || []).filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  );
  const todayKey = new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  const today = (orders || []).filter(
    (o) =>
      new Date(o.created_at).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
      }) === todayKey,
  );
  const filtered = useMemo(
    () =>
      (orders || [])
        .filter(
          (o) =>
            (filter === "All" ||
              (filter === "Active" &&
                !["completed", "cancelled"].includes(o.status)) ||
              (filter === "Pickup" && o.fulfillment === "pickup") ||
              (filter === "Delivery" && o.fulfillment === "delivery") ||
              o.status === filter.toLowerCase()) &&
            `${o.token} ${o.customer_name} ${o.phone}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)),
    [orders, filter, search],
  );
  return (
    <>
      <div className="page-title dashboard-title">
        <div>
          <span className="eyebrow">THE GOLDEN CREW</span>
          <h1>Let’s make someone’s day.</h1>
          <p>Kitchen, counter, delivery. All in one place.</p>
        </div>
        <Link
          className="button button-outline"
          href={process.env.NEXT_PUBLIC_BOARD_URL || "/board"}
          target="_blank"
        >
          Open pickup screen <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="dashboard-stats">
        <article>
          <span>
            <ShoppingBag />
          </span>
          <div>
            <small>Orders today</small>
            <strong>{today.length}</strong>
          </div>
        </article>
        <article>
          <span>
            <ChefHat />
          </span>
          <div>
            <small>Active orders</small>
            <strong>{active.length}</strong>
          </div>
        </article>
        <article>
          <span>
            <CheckCheck />
          </span>
          <div>
            <small>Ready for pickup</small>
            <strong>{active.filter((o) => o.status === "ready").length}</strong>
          </div>
        </article>
        <article>
          <span>
            <IndianRupee />
          </span>
          <div>
            <small>Order value today</small>
            <strong>
              {money(
                today
                  .filter((o) => o.status !== "cancelled")
                  .reduce((sum, o) => sum + o.total, 0),
              )}
            </strong>
          </div>
        </article>
      </div>
      <div className="dashboard-toolbar">
        <div className="dashboard-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
              {f === "Active" && <span>{active.length}</span>}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Token, name or phone"
            aria-label="Search orders"
          />
        </label>
      </div>
      <div className="dashboard-sync">
        <span className="connection-label">
          <i className={connected ? "green-dot" : "amber-dot"} />
          {isDemo
            ? "Demo · shared across this browser’s tabs"
            : connected
              ? "Connected · live updates"
              : "Reconnecting · checking every 10 seconds"}
        </span>
        <button className="text-button" onClick={() => void refresh()}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
      {error && (
        <p role="alert" className="error-box">
          {error} Last loaded orders may be out of date.
        </p>
      )}
      {loading ? (
        <div className="loading-state">Loading the kitchen…</div>
      ) : filtered.length ? (
        <div className="staff-orders">
          {filtered.map((order) => (
            <OrderCard
              key={`${order.id}-${order.status}`}
              order={order}
              onRefresh={() => void refresh()}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state dashboard-empty">
          <ChefHat size={48} strokeWidth={1.2} />
          <h2>{search ? "No matching orders." : "All caught up."}</h2>
          <p>
            {search
              ? "Try a different token, name, or phone number."
              : isDemo
                ? "Place a demo order from the menu to try the kitchen flow."
                : "Orders matching this view will appear here automatically."}
          </p>
          {isDemo && (
            <Link href="/#menu" className="button button-yellow">
              Place a demo order <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
      )}
      <p className="field-hint">
        Showing up to 200 recent orders from the last 7 days. Order value
        includes unpaid cash orders and excludes cancelled orders; this is not a
        payment report.
      </p>
    </>
  );
}
