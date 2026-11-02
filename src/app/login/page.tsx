import { AuthForm } from "@/components/user/AuthForm";
export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export default function Login() {
  return (
    <main id="main" className="container page-shell narrow-page">
      <AuthForm />
    </main>
  );
}
