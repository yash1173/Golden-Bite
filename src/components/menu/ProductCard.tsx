"use client";
import { Plus, Minus } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/utils";
import { useCart } from "@/components/providers/CartProvider";
export function ProductCard({ product }: { product: Product }) {
  const { items, add, quantity } = useCart();
  const count = items.find((i) => i.productId === product.id)?.quantity || 0;
  return (
    <article
      className={`product-card ${!product.available ? "unavailable" : ""}`}
    >
      <div
        className={`product-image ${product.category === "Meals" ? "meal-image" : ""}`}
      >
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className="product-badge">
            {product.badge === "Bestseller" && "★ "}
            {product.badge}
          </span>
        )}
        <span
          className={`diet-mark ${product.vegetarian ? "veg" : "nonveg"}`}
          aria-label={product.vegetarian ? "Vegetarian" : "Non-vegetarian"}
        >
          <i />
        </span>
      </div>
      <div className="product-content">
        <div className="product-meta">
          {product.category}
          <span>·</span>
          {product.calories} kcal
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          {!product.available ? (
            <span className="sold-out">Sold out</span>
          ) : count > 0 ? (
            <div className="quantity-control">
              <button
                aria-label={`Remove one ${product.name}`}
                onClick={() => quantity(product.id, count - 1)}
              >
                <Minus size={15} />
              </button>
              <span aria-live="polite">{count}</span>
              <button
                disabled={count >= 20}
                aria-label={`Add one ${product.name}`}
                onClick={() => add(product.id)}
              >
                <Plus size={15} />
              </button>
            </div>
          ) : (
            <button
              className="add-button"
              onClick={() => add(product.id)}
              aria-label={`Add ${product.name} to bag`}
            >
              Add <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
