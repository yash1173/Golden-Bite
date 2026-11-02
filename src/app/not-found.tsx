import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="container page-shell empty-state">
      <span className="eyebrow">404 · A LITTLE LOST?</span>
      <h1>This bite is off the menu.</h1>
      <p>Let’s get you back to the good stuff.</p>
      <Link href="/" className="button button-yellow">
        Back to the menu
      </Link>
    </main>
  );
}
