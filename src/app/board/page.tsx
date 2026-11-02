import { OrderBoard } from "@/components/board/OrderBoard";
export const metadata = {
  title: "Live pickup screen",
  robots: { index: false, follow: false },
};
export default function BoardPage() {
  return <OrderBoard />;
}
