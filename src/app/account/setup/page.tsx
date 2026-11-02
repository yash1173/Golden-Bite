import { PasswordSetup } from "@/components/user/PasswordSetup";
export const metadata = {
  title: "Finish account setup",
  robots: { index: false, follow: false },
};
export default function SetupPage() {
  return (
    <main id="main" className="container page-shell narrow-page">
      <PasswordSetup />
    </main>
  );
}
