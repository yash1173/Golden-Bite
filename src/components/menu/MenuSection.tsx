"use client";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  X,
  ShoppingBag,
  ArrowRight,
  Sandwich,
  Utensils,
  CupSoda,
  IceCreamBowl,
  Flame,
  LayoutGrid,
} from "lucide-react";
import { categories } from "@/lib/menu";
import type { Category } from "@/lib/types";
import { useCart } from "@/components/providers/CartProvider";
import { money } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
const icons = [LayoutGrid, Sandwich, Utensils, Flame, CupSoda, IceCreamBowl];
export function MenuSection() {
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [veg, setVeg] = useState(false);
  const cart = useCart();
  const filtered = useMemo(
    () =>
      cart.products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          (!veg || p.vegetarian) &&
          `${p.name} ${p.description}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [cart.products, category, veg, search],
  );
  return (
    <section id="menu" className="menu-section container">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FRESHLY MADE. HAPPILY DEVOURED.</span>
          <h2>
            What are you craving<span className="red-text">?</span>
          </h2>
          <p>A little hungry? A lot hungry? We’ve got your kind of good.</p>
        </div>
        <label className="search-box">
          <Search size={19} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find your favourite..."
            aria-label="Search the menu"
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch("")}>
              <X size={16} />
            </button>
          )}
        </label>
      </div>
      <div className="menu-controls">
        <div className="category-tabs" aria-label="Menu categories">
          {categories.map((name, i) => {
            const Icon = icons[i];
            return (
              <button
                key={name}
                className={category === name ? "active" : ""}
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                <Icon size={18} />
                {name === "All" ? "All favourites" : name}
              </button>
            );
          })}
        </div>
        <button
          className={`veg-filter ${veg ? "active" : ""}`}
          aria-pressed={veg}
          onClick={() => setVeg(!veg)}
        >
          <span className="diet-mark veg">
            <i />
          </span>
          Veg only
          <SlidersHorizontal size={15} />
        </button>
      </div>
      {cart.menuError && (
        <div className="error-box" role="alert">
          We couldn’t load the menu. {cart.menuError}
        </div>
      )}
      {cart.menuLoading ? (
        <div className="menu-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="product-skeleton" />
          ))}
        </div>
      ) : (
        <>
          <div className="menu-result-count">
            {filtered.length} delicious{" "}
            {filtered.length === 1 ? "choice" : "choices"}
            <span>Made to order, every time.</span>
          </div>
          <div className="menu-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={36} />
              <h3>No bites found.</h3>
              <p>Try another search, category, or filter.</p>
              <button
                className="text-button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setVeg(false);
                }}
              >
                Show the whole menu
              </button>
            </div>
          )}
        </>
      )}
      <div className="menu-note">
        <span className="diet-mark veg">
          <i />
        </span>
        Vegetarian
        <span className="diet-mark nonveg">
          <i />
        </span>
        Non-vegetarian
        <span>
          Pictures are illustrative. Calories are approximate. Ask our team
          about allergens.
        </span>
      </div>
      {cart.count > 0 && (
        <button className="mobile-bag" onClick={() => cart.setDrawer(true)}>
          <span>
            <ShoppingBag size={18} />
            {cart.count} items · {money(cart.subtotal)}
          </span>
          View bag <ArrowRight size={17} />
        </button>
      )}
    </section>
  );
}
