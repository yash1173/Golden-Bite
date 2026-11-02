import type { CartItem, Fulfillment, OrderStatus, Product } from "./types";
import { defaultSettings, type OrderSettings } from "./config";
export const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
export const deliveryFee = (
  subtotal: number,
  mode: Fulfillment,
  settings: OrderSettings = defaultSettings,
) =>
  mode === "delivery" && subtotal < settings.free_delivery_threshold
    ? settings.delivery_fee
    : 0;
export const cartSubtotal = (items: CartItem[], products: Product[]) =>
  items.reduce(
    (sum, line) =>
      sum +
      (products.find((p) => p.id === line.productId)?.price ?? 0) *
        line.quantity,
    0,
  );
export const statusLabels: Record<OrderStatus, string> = {
  placed: "Order received",
  preparing: "Preparing",
  ready: "Ready to collect",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};
export function nextStatus(
  status: OrderStatus,
  mode: Fulfillment,
): OrderStatus | null {
  if (status === "placed") return "preparing";
  if (status === "preparing")
    return mode === "pickup" ? "ready" : "out_for_delivery";
  if (status === "ready" || status === "out_for_delivery") return "completed";
  return null;
}
export function timeAgo(iso: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(iso)) / 60000),
  );
  return minutes < 1
    ? "Just now"
    : minutes < 60
      ? `${minutes} min ago`
      : `${Math.floor(minutes / 60)}h ago`;
}
