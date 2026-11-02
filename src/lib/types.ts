export type Fulfillment = "pickup" | "delivery";
export type OrderStatus =
  | "placed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";
export type Category =
  "All" | "Burgers" | "Meals" | "Sides" | "Drinks" | "Desserts";

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Exclude<Category, "All">;
  price: number; // integer paise, throughout the app and database
  image: string;
  vegetarian: boolean;
  badge?: string;
  calories: number;
  available: boolean;
}
export interface CartItem {
  productId: string;
  quantity: number;
}
export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}
export interface Order {
  id: string;
  user_id: string;
  token: string;
  fulfillment: Fulfillment;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  address: string | null;
  postcode: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}
export interface BoardEntry {
  order_id: string;
  token: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}
export interface CheckoutInput {
  requestId: string;
  customerName: string;
  phone: string;
  address: string;
  postcode: string;
  notes: string;
  fulfillment: Fulfillment;
  items: CartItem[];
  expectedTotal: number;
}
