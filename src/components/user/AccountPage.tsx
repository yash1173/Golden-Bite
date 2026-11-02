"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ArrowUpRight, ShoppingBag, LogOut } from "lucide-react";
import { useLiveData } from "@/hooks/use-live-data";
import { fetchOrders } from "@/lib/orders";
import { getSupabase, isDemo } from "@/lib/supabase/client";
import { money } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AuthForm } from "./AuthForm";
export function AccountPage() {
  const loader = useCallback(() => fetchOrders("customer"), []);
  const { data: orders, error, loading, refresh } = useLiveData(loader);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    if (isDemo) return;
    try {
      const supabase = getSupabase();
      void supabase.auth.getUser().then(({ data }) => setUser(data.user));
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setTimeout(() => void refresh(), 0);
      });
      return () => data.subscription.unsubscribe();
    } catch {
      /* Configuration errors are rendered by the order loader. */
    }
  }, [refresh]);
  const signedIn = user && !user.is_anonymous;
  return (
    <>
      <div className="page-title account-title">
        <div>
          <span className="eyebrow">YOUR GOLDEN CORNER</span>
          <h1>Hey, good to see you.</h1>
          <p>
            {signedIn
              ? user.email
              : "Your favourites. Your orders. Your next happy moment."}
          </p>
        </div>
        {signedIn && (
          <button
            className="text-button"
            onClick={async () => {
              await getSupabase().auth.signOut();
              window.location.reload();
            }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        )}
      </div>
      <div className="account-grid">
        <section>
          <div className="section-heading">
            <h2>Your orders</h2>
            <Link className="text-button" href="/#menu">
              Order again <ArrowUpRight size={17} />
            </Link>
          </div>
          {!signedIn && (
            <p className="field-hint">
              {isDemo
                ? "Demo history is shared across tabs in this browser."
                : "Guest history is available in this browser. Create an account to keep it across devices. Signing in to an existing account shows that account’s history."}
            </p>
          )}
          {loading && <div className="loading-state">Loading your orders…</div>}
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          {orders?.length === 0 && (
            <div className="empty-state">
              <ShoppingBag size={40} />
              <h3>Your first golden moment awaits.</h3>
              <p>Pick your favourites and we’ll take it from there.</p>
              <Link className="button button-yellow" href="/#menu">
                Explore the menu
              </Link>
            </div>
          )}
          {orders?.map((order) => (
            <Link
              className="history-order"
              key={order.id}
              href={`/orders/${order.id}`}
            >
              <div className="history-token">{order.token}</div>
              <div>
                <b>
                  {order.fulfillment === "pickup" ? "Pickup" : "Delivery"} ·{" "}
                  {money(order.total)}
                </b>
                <p>
                  {order.items
                    .map((i) => `${i.quantity} × ${i.name}`)
                    .join(", ")}
                </p>
                <small>
                  {new Date(order.created_at).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </small>
              </div>
              <div>
                <StatusBadge status={order.status} />
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </section>
        <aside>
          {!signedIn ? (
            <AuthForm />
          ) : (
            <div className="form-card">
              <h2>You’re all set.</h2>
              <p>
                Your orders are linked to your account. Place a new order to add
                another golden moment.
              </p>
              <Link href="/#menu" className="button button-yellow">
                Find your favourite
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
