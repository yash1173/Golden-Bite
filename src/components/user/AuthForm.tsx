"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ensureCustomer, getSupabase, isDemo } from "@/lib/supabase/client";
export function AuthForm({ staff = false }: { staff?: boolean }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    try {
      const supabase = getSupabase();
      if (signup) {
        await ensureCustomer();
        const { data: current, error: userError } =
          await supabase.auth.getUser();
        if (userError) throw userError;
        if (!current.user?.is_anonymous) {
          router.push("/account");
          return;
        }
        // Supabase requires verifying the linked email BEFORE adding a password.
        const result = await supabase.auth.updateUser(
          { email },
          { emailRedirectTo: `${window.location.origin}/account/setup` },
        );
        if (result.error) throw result.error;
        setMessage(
          "Check your email. Open the confirmation link to choose a password and finish setting up your account. Your guest orders stay linked.",
        );
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        if (staff) window.location.assign("/dashboard");
        else {
          router.push("/account");
          router.refresh();
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }
  if (isDemo)
    return (
      <div className="notice-box">
        Account sign-in becomes available after connecting Supabase. In demo
        mode, order history is saved in this browser.
      </div>
    );
  return (
    <div className="auth-card">
      <span className="eyebrow">
        {staff ? "FOR THE GOLDEN CREW" : "YOUR LITTLE CORNER OF GOLDEN"}
      </span>
      <h2>
        {staff
          ? "Staff sign in"
          : signup
            ? "Make yourself at home."
            : "Welcome back."}
      </h2>
      <p>
        {staff
          ? "Use the account your administrator added to the staff list."
          : signup
            ? "Save your guest orders and come back on any device."
            : "Sign in to see your account’s orders."}
      </p>
      <form onSubmit={submit}>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>
        {!signup && (
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              required
            />
          </label>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice-box" role="status">
            {message}
          </p>
        )}
        <button className="button button-yellow full-width" disabled={busy}>
          {busy
            ? "One moment…"
            : signup
              ? "Send confirmation email"
              : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      {!staff && (
        <button
          className="text-button auth-switch"
          onClick={() => {
            setSignup(!signup);
            setError("");
            setMessage("");
          }}
        >
          {signup
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      )}
    </div>
  );
}
