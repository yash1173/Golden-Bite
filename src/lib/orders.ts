import { getSupabase, ensureCustomer, isDemo } from "./supabase/client";
import {
  createDemoOrder,
  readDemoOrders,
  updateDemoOrder,
  DEMO_EVENT,
} from "./demo-store";
import type {
  BoardEntry,
  CheckoutInput,
  Order,
  OrderStatus,
  Product,
} from "./types";
import { menu } from "./menu";
import { defaultSettings, type OrderSettings } from "./config";

export async function fetchSettings(): Promise<OrderSettings> {
  if (isDemo) return defaultSettings;
  const { data, error } = await getSupabase()
    .from("store_settings")
    .select("delivery_fee,free_delivery_threshold,serviceable_postcodes")
    .eq("id", true)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMenu(): Promise<Product[]> {
  if (isDemo) return menu;
  const { data, error } = await getSupabase()
    .from("products")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}
export async function placeOrder(input: CheckoutInput): Promise<string> {
  if (isDemo) return (await createDemoOrder(input)).id;
  await ensureCustomer();
  const { data, error } = await getSupabase().rpc("place_order", {
    p_request_id: input.requestId,
    p_fulfillment: input.fulfillment,
    p_customer_name: input.customerName.trim(),
    p_phone: input.phone,
    p_address: input.address.trim(),
    p_postcode: input.postcode,
    p_notes: input.notes.trim(),
    p_items: input.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    })),
    p_expected_total: input.expectedTotal,
  });
  if (error) throw new Error(error.message);
  return data as string;
}
export async function fetchOrders(
  scope: "customer" | "staff",
): Promise<Order[]> {
  if (isDemo) return readDemoOrders();
  const supabase = getSupabase();
  const uid =
    scope === "customer"
      ? await ensureCustomer()
      : (await supabase.auth.getUser()).data.user?.id;
  if (!uid) throw new Error("Sign in to see orders.");
  let query = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (scope === "customer") query = query.eq("user_id", uid);
  else
    query = query.gte(
      "created_at",
      new Date(Date.now() - 7 * 86400000).toISOString(),
    );
  const { data, error } = await query;
  if (error) throw error;
  return data as Order[];
}
export async function fetchOrder(id: string): Promise<Order | null> {
  if (isDemo) return readDemoOrders().find((o) => o.id === id) ?? null;
  await ensureCustomer();
  const { data, error } = await getSupabase()
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}
export async function fetchBoard(): Promise<BoardEntry[]> {
  if (isDemo)
    return readDemoOrders()
      .filter((o) => o.fulfillment === "pickup")
      .map((o) => ({
        order_id: o.id,
        token: o.token,
        status: o.status,
        created_at: o.created_at,
        updated_at: o.updated_at,
      }));
  // This public table contains tokens and statuses only. No customer information.
  const { data, error } = await getSupabase()
    .from("order_board")
    .select("order_id,token,status,created_at,updated_at")
    .gte("created_at", new Date(Date.now() - 86400000).toISOString())
    .order("created_at");
  if (error) throw error;
  return data as BoardEntry[];
}
export async function changeStatus(id: string, status: OrderStatus) {
  if (isDemo) return updateDemoOrder(id, status);
  const { error } = await getSupabase().rpc("update_order_status", {
    p_order_id: id,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}
export function subscribeOrders(
  table: "orders" | "order_board",
  onChange: () => void,
  onConnection: (connected: boolean) => void,
) {
  if (isDemo) {
    const listener = () => onChange();
    window.addEventListener("storage", listener);
    window.addEventListener(DEMO_EVENT, listener);
    onConnection(true);
    return () => {
      window.removeEventListener("storage", listener);
      window.removeEventListener(DEMO_EVENT, listener);
    };
  }
  const supabase = getSupabase();
  const channel = supabase
    .channel(`${table}-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
    .subscribe((status) => {
      onConnection(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") onChange();
    });
  return () => {
    void supabase.removeChannel(channel);
  };
}
