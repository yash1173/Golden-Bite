"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShoppingBag, UserRound, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCart } from "@/components/providers/CartProvider";
export function Navbar() {
  const { count, setDrawer } = useCart();
  const pathname = usePathname();
  if (pathname === "/board" || process.env.NEXT_PUBLIC_BOARD_ONLY === "true")
    return null;
  return (
    <>
      <div className="announcement">
        <span>Good food. Good mood. Golden moments.</span>
        <Link href="/#menu">
          Find your next favourite <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="navbar">
        <div className="container nav-inner">
          <Logo />
          <nav aria-label="Main navigation">
            <Link
              className={pathname === "/" ? "nav-active" : ""}
              href="/#menu"
            >
              Our menu
            </Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link
              className={pathname === "/account" ? "nav-active" : ""}
              href="/account"
            >
              My orders
            </Link>
          </nav>
          <div className="nav-actions">
            <span className="nav-location">
              <MapPin size={17} />
              <span>
                Indiranagar, Bengaluru<small>Your neighbourhood bite</small>
              </span>
            </span>
            <Link
              className="icon-button account-link"
              href="/account"
              aria-label="Your account"
            >
              <UserRound size={21} />
            </Link>
            <button
              className="bag-button"
              aria-label={`Open your bag, ${count} items`}
              onClick={() => setDrawer(true)}
            >
              <ShoppingBag size={18} />
              <span>Your bag</span>
              <b>{count}</b>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
