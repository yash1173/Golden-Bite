"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase, isDemo } from "@/lib/supabase/client";
export function PasswordSetup() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    if (isDemo) {
      setChecking(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await getSupabase().auth.getUser();
        if (error) throw error;
        if (mounted)
          setReady(!!data.user?.email_confirmed_at && !data.user?.is_anonymous);
      } catch (e) {
        if (mounted)
          setError(
            e instanceof Error
              ? e.message
              : "Couldn’t verify the confirmation link.",
          );
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    if (data.get("password") !== data.get("confirm")) {
      setError("Those passwords don’t match. Please try again.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await getSupabase().auth.updateUser({
        password: String(data.get("password")),
      });
      if (error) throw error;
      router.replace("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t save your password.");
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <div className="loading-state">Checking your confirmation link…</div>
    );
  if (!ready)
    return (
      <div className="empty-state">
        <h2>Confirm your email first.</h2>
        <p>
          {error ||
            "Open the confirmation email in this browser, then choose your password here."}
        </p>
        <Link className="button button-yellow" href="/account">
          Back to your account
        </Link>
      </div>
    );
  return (
    <div className="auth-card">
      <span className="eyebrow">ONE LAST THING</span>
      <h2>Make it your account.</h2>
      <p>
        Your email is confirmed. Choose a password to sign in on any device.
      </p>
      <form onSubmit={submit}>
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
        <button className="button button-yellow full-width" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </div>
  );
}
