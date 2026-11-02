"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { getSupabase, isDemo } from "@/lib/supabase/client";
import { AuthForm } from "@/components/user/AuthForm";
export function StaffGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "guest" | "denied" | "staff">(
    "loading",
  );
  const [error, setError] = useState("");
  useEffect(() => {
    if (isDemo) {
      setState("staff");
      return;
    }
    let mounted = true;
    async function check() {
      try {
        const supabase = getSupabase();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (!user || user.is_anonymous) {
          if (mounted) setState("guest");
          return;
        }
        if (authError) throw authError;
        const { data, error: roleError } = await supabase.rpc("is_staff");
        if (roleError) throw roleError;
        if (mounted) setState(data ? "staff" : "denied");
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Access check failed.");
          setState("denied");
        }
      }
    }
    void check();
    return () => {
      mounted = false;
    };
  }, []);
  if (state === "loading")
    return <div className="loading-state">Checking crew access…</div>;
  if (state === "guest")
    return (
      <div className="narrow-page">
        <AuthForm staff />
      </div>
    );
  if (state === "denied")
    return (
      <div className="empty-state">
        <ShieldCheck size={44} />
        <h1>This one’s for the crew.</h1>
        <p>
          {error ||
            "Your account is signed in, but it isn’t on the staff list. Ask the store administrator to add your user ID."}
        </p>
        <button
          className="button button-yellow"
          onClick={async () => {
            await getSupabase().auth.signOut();
            window.location.reload();
          }}
        >
          <LogOut size={16} />
          Use another account
        </button>
      </div>
    );
  return (
    <>
      {isDemo && (
        <div className="notice-box">
          <b>Demo crew dashboard.</b> You can try all order controls here.
          Changes affect only this browser’s demo orders. Connected stores
          require an authorized staff account.
        </div>
      )}
      {children}
    </>
  );
}
