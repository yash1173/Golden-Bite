"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Store,
  Truck,
  MapPin,
  Clock3,
  Banknote,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { money, deliveryFee } from "@/lib/utils";
import { STORE } from "@/lib/menu";
import { placeOrder } from "@/lib/orders";
import { isDemo } from "@/lib/supabase/client";
export function CheckoutForm() {
  const cart = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);
  const [postcode, setPostcode] = useState("");
  const fee = deliveryFee(cart.subtotal, cart.mode, cart.settings);
  const invalidBag = cart.items.some(
    (i) => !cart.products.find((p) => p.id === i.productId && p.available),
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const data = new FormData(event.currentTarget);
    if (
      cart.mode === "delivery" &&
      !cart.settings.serviceable_postcodes.includes(postcode)
    ) {
      setError(
        "We don’t deliver to this postcode yet. Choose pickup or use a supported postcode below.",
      );
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      // Persist through uncertain network failures so retrying cannot duplicate an order.
      const requestId =
        sessionStorage.getItem("golden-bite-pending-order") ||
        crypto.randomUUID();
      sessionStorage.setItem("golden-bite-pending-order", requestId);
      const id = await placeOrder({
        requestId,
        customerName: String(data.get("name")),
        phone: String(data.get("phone")),
        address: String(data.get("address") || ""),
        postcode,
        notes: String(data.get("notes") || ""),
        fulfillment: cart.mode,
        items: cart.items,
        expectedTotal: cart.subtotal + fee,
      });
      sessionStorage.removeItem("golden-bite-pending-order");
      cart.clear();
      router.replace(`/orders/${id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn’t place your order. Please try again.",
      );
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  if (!cart.hydrated || cart.menuLoading)
    return <div className="loading-state">Getting your bag ready…</div>;
  if (!cart.items.length && !submitting)
    return (
      <div className="empty-state">
        <h2>Let’s put something good in your bag.</h2>
        <p>Your bag is empty. Explore the menu to get started.</p>
        <Link className="button button-yellow" href="/#menu">
          Explore the menu <ArrowRight size={18} />
        </Link>
      </div>
    );
  return (
    <>
      <Link href="/#menu" className="back-link">
        <ArrowLeft size={16} />
        Back to the good stuff
      </Link>
      <div className="page-title">
        <span className="eyebrow">YOU’RE ONE STEP FROM HAPPY</span>
        <h1>Make it yours.</h1>
        <p>A few details, and we’ll get cooking.</p>
      </div>
      {isDemo && (
        <div className="notice-box">
          Demo checkout — this creates a test order in this browser. No
          restaurant, courier, or payment is contacted.
        </div>
      )}
      <form onSubmit={submit} className="checkout-grid">
        <div className="checkout-fields">
          <section className="form-card">
            <h2>
              <span>1</span>How would you like it?
            </h2>
            <div className="fulfillment-options">
              <button
                type="button"
                aria-pressed={cart.mode === "pickup"}
                className={cart.mode === "pickup" ? "selected" : ""}
                onClick={() => cart.setMode("pickup")}
              >
                <Store />
                <b>Pick it up</b>
                <small>Ready in ~15–20 min</small>
              </button>
              <button
                type="button"
                aria-pressed={cart.mode === "delivery"}
                className={cart.mode === "delivery" ? "selected" : ""}
                onClick={() => cart.setMode("delivery")}
              >
                <Truck />
                <b>Bring it to me</b>
                <small>Delivery in ~30–45 min</small>
              </button>
            </div>
            {cart.mode === "pickup" && (
              <div className="pickup-address">
                <MapPin size={20} />
                <div>
                  <b>{STORE.name}</b>
                  <p>{STORE.address}</p>
                  <small>
                    <Clock3 size={13} />
                    Counter hours: {STORE.hours}
                  </small>
                </div>
              </div>
            )}
          </section>
          <section className="form-card">
            <h2>
              <span>2</span>Your details
            </h2>
            <div className="field-grid">
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                  minLength={2}
                  maxLength={80}
                />
              </label>
              <label>
                Mobile number
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="10-digit mobile number"
                  pattern="[6-9][0-9]{9}"
                  title="Enter a 10-digit Indian mobile number starting with 6, 7, 8, or 9"
                  required
                />
              </label>
            </div>
            {cart.mode === "delivery" && (
              <>
                <label>
                  Delivery address
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    placeholder="Flat / house, building, street and landmark"
                    required
                    minLength={10}
                    maxLength={500}
                    rows={3}
                  />
                </label>
                <label>
                  Postcode
                  <input
                    name="postcode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="e.g. 560038"
                    value={postcode}
                    onChange={(e) =>
                      setPostcode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    pattern="[0-9]{6}"
                    required
                  />
                </label>
                <details className="postcode-help">
                  <summary>Where do we deliver?</summary>
                  <p>
                    Available in Bengaluru postcodes:{" "}
                    {cart.settings.serviceable_postcodes.join(", ")}. Delivery
                    is {money(cart.settings.delivery_fee)}, or free on orders of{" "}
                    {money(cart.settings.free_delivery_threshold)} and above.
                  </p>
                </details>
              </>
            )}
            <label>
              Anything we should know?{" "}
              <span className="optional">(optional)</span>
              <textarea
                name="notes"
                placeholder="Add a note for our kitchen..."
                rows={2}
                maxLength={500}
              />
            </label>
            <p className="field-hint">
              For allergies, speak to the restaurant before ordering. Kitchen
              notes cannot guarantee an allergen-free meal.
            </p>
          </section>
          <section className="form-card">
            <h2>
              <span>3</span>Payment, kept simple.
            </h2>
            <div className="payment-option">
              <Banknote />
              <div>
                <b>
                  Pay{" "}
                  {cart.mode === "delivery" ? "on delivery" : "at the counter"}
                </b>
                <p>Cash payment when you receive your order.</p>
              </div>
              <span className="radio-checked" />
            </div>
          </section>
        </div>
        <aside className="order-summary">
          <div className="summary-heading">
            <h2>The good stuff.</h2>
            <button
              type="button"
              className="text-button"
              onClick={() => cart.setDrawer(true)}
            >
              Edit bag
            </button>
          </div>
          {cart.items.map((line) => {
            const p = cart.products.find((p) => p.id === line.productId);
            return (
              <div className="summary-item" key={line.productId}>
                <img src={p?.image || "/images/classic.jpg"} alt="" />
                <div>
                  <b>{p?.name || "Unavailable item"}</b>
                  <small>Qty: {line.quantity}</small>
                </div>
                <strong>{money((p?.price || 0) * line.quantity)}</strong>
              </div>
            );
          })}
          <div className="summary-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(cart.subtotal)}</span>
            </div>
            <div>
              <span>{cart.mode === "pickup" ? "Pickup" : "Delivery fee"}</span>
              <span className={!fee ? "green-text" : ""}>
                {fee ? money(fee) : "Free"}
              </span>
            </div>
            <div className="total-line">
              <b>Total to pay</b>
              <b>{money(cart.subtotal + fee)}</b>
            </div>
            <small>Listed prices include applicable taxes.</small>
          </div>
          {(invalidBag || cart.menuError) && (
            <p className="error-box">
              An item is unavailable. Please update your bag before ordering.
            </p>
          )}
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-yellow full-width"
            type="submit"
            disabled={submitting || invalidBag || !!cart.menuError}
          >
            {submitting
              ? "Sending to the kitchen…"
              : isDemo
                ? "Place demo order"
                : "Place my order"}
            <ArrowRight size={18} />
          </button>
          <div className="checkout-trust">
            <ShieldCheck size={16} />
            Your details stay private. Your token goes public.
          </div>
        </aside>
      </form>
    </>
  );
}
