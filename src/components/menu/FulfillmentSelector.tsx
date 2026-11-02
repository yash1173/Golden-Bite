"use client";
import { Store, Truck, ChevronDown } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
export function FulfillmentSelector() {
  const { mode, setMode } = useCart();
  return (
    <div className="fulfillment-bar">
      <div className="mode-toggle">
        <button
          aria-pressed={mode === "pickup"}
          className={mode === "pickup" ? "selected" : ""}
          onClick={() => setMode("pickup")}
        >
          <Store size={18} />
          Pickup
        </button>
        <button
          aria-pressed={mode === "delivery"}
          className={mode === "delivery" ? "selected" : ""}
          onClick={() => setMode("delivery")}
        >
          <Truck size={18} />
          Delivery
        </button>
      </div>
      <div className="fulfillment-detail">
        <span className="round-icon">
          {mode === "pickup" ? <Store size={19} /> : <Truck size={19} />}
        </span>
        <div>
          <small>
            {mode === "pickup" ? "PICKING UP FROM" : "DELIVERING IN"}
          </small>
          <b>
            {mode === "pickup"
              ? "Golden Bite, Indiranagar"
              : "Selected Bengaluru postcodes"}
          </b>
        </div>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
      <div className="fulfillment-time">
        <span className="green-dot" />
        {mode === "pickup"
          ? "Freshly made · About 15–20 min"
          : "At your door · About 30–45 min"}
      </div>
    </div>
  );
}
