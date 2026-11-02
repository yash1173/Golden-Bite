import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
export const metadata: Metadata = { title: "Checkout" };
export default function CheckoutPage() {
  return (
    <main id="main" className="container page-shell">
      <CheckoutForm />
    </main>
  );
}
