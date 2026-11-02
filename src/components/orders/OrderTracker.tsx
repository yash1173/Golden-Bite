"use client";
import { useCallback } from "react";
import Link from "next/link";
import {
  Check,
  Clock3,
  ChefHat,
  ShoppingBag,
  Truck,
  ArrowUpRight,
  MapPin,
  Banknote,
} from "lucide-react";
import { fetchOrder } from "@/lib/orders";
import { useLiveData } from "@/hooks/use-live-data";
import { money } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isDemo } from "@/lib/supabase/client";
export function OrderTracker({ id }: { id: string }) {
  const loader = useCallback(() => fetchOrder(id), [id]);
  const {
    data: order,
    error,
    loading,
    connected,
    refresh,
  } = useLiveData(loader);
  if (loading)
    return <div className="loading-state">Finding your golden moment…</div>;
  if (error || !order)
    return (
      <div className="empty-state">
        <h1>We couldn’t find that order.</h1>
        <p>
          {error ||
            "Open this link in the browser you ordered from, or sign in to the account used for the order."}
        </p>
        <button className="button button-yellow" onClick={() => void refresh()}>
          Try again
        </button>
        <Link className="text-button" href="/account">
          Go to my orders
        </Link>
      </div>
    );
  const delivery = order.fulfillment === "delivery";
  const steps = [
    { name: "Order received", status: "placed", icon: Check },
    { name: "In the kitchen", status: "preparing", icon: ChefHat },
    {
      name: delivery ? "On its way" : "Ready to collect",
      status: delivery ? "out_for_delivery" : "ready",
      icon: delivery ? Truck : ShoppingBag,
    },
    {
      name: delivery ? "Delivered" : "Collected",
      status: "completed",
      icon: Check,
    },
  ];
  const stepIndex = steps.findIndex((s) => s.status === order.status);
  return (
    <div className="tracker">
      <div className="tracker-intro">
        <div className="success-circle">
          <Check size={28} />
        </div>
        <span className="eyebrow">
          {order.status === "completed"
            ? "THANKS FOR SHARING A GOLDEN MOMENT"
            : order.status === "cancelled"
              ? "ORDER CANCELLED"
              : "GOOD THINGS ARE ON THE WAY"}
        </span>
        <h1>
          {order.status === "cancelled"
            ? "This order was cancelled."
            : order.status === "completed"
              ? "Hope that hit the spot."
              : order.status === "ready"
                ? "Your order is ready!"
                : "We’ve got your order."}
        </h1>
        <p>
          {order.status === "ready"
            ? "Come to the pickup counter and show your token."
            : order.status === "cancelled"
              ? "No payment has been collected online. Contact the restaurant with any questions."
              : `Thanks, ${order.customer_name}. ${delivery ? "Follow your delivery here." : "Keep your token handy. We’ll take care of the rest."}`}
        </p>
        {isDemo && (
          <span className="demo-pill">
            Demo order · Nothing is being prepared or delivered
          </span>
        )}
      </div>
      <div className="tracker-card">
        <div className="token-header">
          <div>
            <small>YOUR {delivery ? "ORDER" : "PICKUP"} TOKEN</small>
            <strong data-testid="order-token">{order.token}</strong>
          </div>
          <div>
            <StatusBadge status={order.status} />
            <span className="connection-label">
              <i className={connected ? "green-dot" : "amber-dot"} />
              {isDemo
                ? "Demo · updates across tabs"
                : connected
                  ? "Live order updates"
                  : "Checking every 10 seconds"}
            </span>
          </div>
        </div>
        {order.status !== "cancelled" && (
          <div className="order-progress">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.status}
                  className={`progress-step ${index <= stepIndex ? "done" : ""} ${index === stepIndex ? "current" : ""}`}
                >
                  <span>
                    <Icon size={20} />
                  </span>
                  <b>{step.name}</b>
                </div>
              );
            })}
          </div>
        )}
        <div className="tracker-location">
          <MapPin size={22} />
          <div>
            <b>
              {delivery
                ? "Delivering to"
                : "Pick up from Golden Bite, Indiranagar"}
            </b>
            <p>
              {delivery
                ? `${order.address}, ${order.postcode}`
                : "100 Feet Road, Indiranagar, Bengaluru"}
            </p>
          </div>
          <span>
            <Clock3 size={15} />
            {delivery ? "~30–45 min" : "~15–20 min"}
          </span>
        </div>
        {!delivery && (
          <Link
            className="board-link"
            href={process.env.NEXT_PUBLIC_BOARD_URL || "/board"}
            target="_blank"
            rel="noreferrer"
          >
            See your token on the live pickup screen <ArrowUpRight size={17} />
          </Link>
        )}
      </div>
      <div className="tracker-receipt">
        <h2>Your order</h2>
        {order.items.map((item, i) => (
          <div key={i}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <b>{money(item.quantity * item.unit_price)}</b>
          </div>
        ))}
        {order.delivery_fee > 0 && (
          <div>
            <span>Delivery</span>
            <b>{money(order.delivery_fee)}</b>
          </div>
        )}
        <div className="total-line">
          <b>Total</b>
          <b>{money(order.total)}</b>
        </div>
        <small>
          <Banknote size={16} />
          Pay {delivery ? "on delivery" : "at the counter"} · Cash
        </small>
        {order.notes && (
          <p className="order-notes">
            <b>Kitchen note:</b> {order.notes}
          </p>
        )}
      </div>
      <div className="tracker-actions">
        <Link className="button button-yellow" href="/#menu">
          Keep exploring the menu <ArrowUpRight size={17} />
        </Link>
        <Link className="text-button" href="/account">
          View my orders
        </Link>
        {isDemo && (
          <Link className="text-button" href="/dashboard" target="_blank">
            Try the staff dashboard <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
