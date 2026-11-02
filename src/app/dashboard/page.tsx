import { StaffGate } from "@/components/dashboard/StaffGate";
import { Dashboard } from "@/components/dashboard/Dashboard";
export const metadata = {
  title: "Staff dashboard",
  robots: { index: false, follow: false },
};
export default function DashboardPage() {
  return (
    <main id="main" className="container page-shell">
      <StaffGate>
        <Dashboard />
      </StaffGate>
    </main>
  );
}
