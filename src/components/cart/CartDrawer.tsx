"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  Store,
} from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { deliveryFee, money } from "@/lib/utils";
export function CartDrawer() {
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (cart.drawer) dialog.current?.showModal();
    else dialog.current?.close();
    document.body.style.overflow = cart.drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cart.drawer]);
  const fee = deliveryFee(cart.subtotal, cart.mode, cart.settings);
  return (
    <dialog
      ref={dialog}
      className="cart-dialog"
      aria-labelledby="bag-title"
      onCancel={() => cart.setDrawer(false)}
      onClick={(e) => {
        if (e.target === dialog.current) cart.setDrawer(false);
      }}
    >
      <div className="cart-panel">
        <div className="cart-heading">
          <div>
            <span className="eyebrow">GOOD THINGS INSIDE</span>
            <h2 id="bag-title">
              Your bag <span>({cart.count})</span>
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close bag"
            onClick={() => cart.setDrawer(false)}
          >
            <X />
          </button>
        </div>
        <div className="mode-toggle">
          <button
            aria-pressed={cart.mode === "pickup"}
            className={cart.mode === "pickup" ? "selected" : ""}
            onClick={() => cart.setMode("pickup")}
          >
            <Store size={17} />
            Pickup
          </button>
          <button
            aria-pressed={cart.mode === "delivery"}
            className={cart.mode === "delivery" ? "selected" : ""}
            onClick={() => cart.setMode("delivery")}
          >
            <Truck size={17} />
            Delivery
          </button>
        </div>
        <div className="cart-lines">
          {!cart.items.length ? (
            <div className="empty-state">
              <ShoppingBag size={46} strokeWidth={1.3} />
              <h3>Your next favourite is waiting.</h3>
              <p>Add something delicious to get started.</p>
              <button
                className="button button-yellow"
                onClick={() => cart.setDrawer(false)}
              >
                Explore the menu
              </button>
            </div>
          ) : (
            cart.items.map((line) => {
              const product = cart.products.find(
                (p) => p.id === line.productId,
              );
              return (
                <div className="cart-line" key={line.productId}>
                  <img src={product?.image || "/images/classic.jpg"} alt="" />
                  <div>
                    <h4>{product?.name || "Unavailable item"}</h4>
                    <span>{money((product?.price || 0) * line.quantity)}</span>
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          cart.quantity(line.productId, line.quantity - 1)
                        }
                        aria-label={`Remove one ${product?.name}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        disabled={line.quantity >= 20}
                        onClick={() =>
                          cart.quantity(line.productId, line.quantity + 1)
                        }
                        aria-label={`Add one ${product?.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {cart.items.length > 0 && (
          <div className="cart-total">
            <div>
              <span>Subtotal</span>
              <b>{money(cart.subtotal)}</b>
            </div>
            <div>
              <span>{cart.mode === "delivery" ? "Delivery" : "Pickup"}</span>
              <span>{fee ? money(fee) : "Free"}</span>
            </div>
            <div className="total-line">
              <b>Total</b>
              <b>{money(cart.subtotal + fee)}</b>
            </div>
            <Link
              className="button button-yellow full-width"
              href="/checkout"
              onClick={() => cart.setDrawer(false)}
            >
              Let’s checkout <ArrowRight size={18} />
            </Link>
            <small>
              Pay {cart.mode === "delivery" ? "on delivery" : "at the counter"}{" "}
              · No online payment required
            </small>
          </div>
        )}
      </div>
    </dialog>
  );
}
