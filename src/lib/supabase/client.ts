import { createClient, type SupabaseClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const isDemo = !url && !key;
let client: SupabaseClient | undefined;
export function getSupabase() {
  if (!url || !key)
    throw new Error(
      "Set both Supabase environment variables, then rebuild the app. Clear both to use demo mode.",
    );
  client ??= createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
let guestPromise: Promise<string> | undefined;
export async function ensureCustomer() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user.id;
  guestPromise ??= (async () => {
    const { data: guest, error: signInError } =
      await supabase.auth.signInAnonymously();
    if (signInError || !guest.user)
      throw new Error(
        signInError?.message ?? "Could not start a guest session.",
      );
    return guest.user.id;
  })().finally(() => {
    guestPromise = undefined;
  });
  return guestPromise;
}
