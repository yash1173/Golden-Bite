import type { OrderStatus } from "@/lib/types";
import { statusLabels } from "@/lib/utils";
export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}
