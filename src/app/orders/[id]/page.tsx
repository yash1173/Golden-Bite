import { OrderTracker } from "@/components/orders/OrderTracker";
export const metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main id="main" className="container page-shell">
      <OrderTracker id={id} />
    </main>
  );
}
