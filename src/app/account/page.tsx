import { AccountPage } from "@/components/user/AccountPage";
export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};
export default function Account() {
  return (
    <main id="main" className="container page-shell">
      <AccountPage />
    </main>
  );
}
