import { menu, SERVICEABLE_POSTCODES } from "./menu";
import { cartSubtotal, deliveryFee, nextStatus } from "./utils";
import type { CheckoutInput, Order, OrderStatus } from "./types";

const KEY = "golden-bite-demo-orders-v1";
export const DEMO_EVENT = "golden-bite-orders-changed";
export function readDemoOrders(): Order[] {
  const value = localStorage.getItem(KEY);
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(
      "Demo order storage could not be read. Clear site data to reset it.",
    );
  }
}
function save(orders: Order[]) {
  localStorage.setItem(KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event(DEMO_EVENT));
}
async function locked<T>(fn: () => T): Promise<T> {
  return navigator.locks
    ? navigator.locks.request("golden-bite-demo", fn)
    : fn();
}
export async function createDemoOrder(input: CheckoutInput) {
  return locked(() => {
    const orders = readDemoOrders();
    const existing = orders.find((order) => order.id === input.requestId);
    if (existing) return existing;
    if (
      !input.items.length ||
      input.items.some(
        (i) =>
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > 20 ||
          !menu.find((p) => p.id === i.productId && p.available),
      )
    )
      throw new Error("Please check the items in your bag.");
    if (
      input.fulfillment === "delivery" &&
      !SERVICEABLE_POSTCODES.includes(input.postcode)
    )
      throw new Error(
        "We don’t deliver to that postcode yet. Please choose pickup.",
      );
    const subtotal = cartSubtotal(input.items, menu);
    const fee = deliveryFee(subtotal, input.fulfillment);
    const now = new Date().toISOString();
    const order: Order = {
      id: input.requestId,
      user_id: "demo-customer",
      token: `G${String(orders.length + 1).padStart(3, "0")}`,
      fulfillment: input.fulfillment,
      status: "placed",
      customer_name: input.customerName.trim(),
      phone: input.phone,
      address: input.fulfillment === "delivery" ? input.address.trim() : null,
      postcode: input.fulfillment === "delivery" ? input.postcode : null,
      notes: input.notes.trim() || null,
      subtotal,
      delivery_fee: fee,
      total: subtotal + fee,
      created_at: now,
      updated_at: now,
      items: input.items.map((line) => {
        const product = menu.find((p) => p.id === line.productId)!;
        return {
          product_id: product.id,
          name: product.name,
          quantity: line.quantity,
          unit_price: product.price,
        };
      }),
    };
    save([order, ...orders]);
    return order;
  });
}
export async function updateDemoOrder(id: string, status: OrderStatus) {
  return locked(() => {
    const orders = readDemoOrders();
    const order = orders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found.");
    if (
      status !== nextStatus(order.status, order.fulfillment) &&
      !(
        status === "cancelled" && ["placed", "preparing"].includes(order.status)
      )
    )
      throw new Error("This order has already changed. Refresh and try again.");
    order.status = status;
    order.updated_at = new Date().toISOString();
    save(orders);
  });
}
