"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="container page-shell empty-state">
      <h1>Something needs another try.</h1>
      <p>We couldn’t load this page. Your saved bag is still here.</p>
      <button className="button button-yellow" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
