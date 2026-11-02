import Link from "next/link";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`logo ${light ? "logo-light" : ""}`}
      aria-label="Golden Bite home"
    >
      <span className="logo-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        golden
        <span className="logo-bite">
          bite<span className="logo-dot">.</span>
        </span>
      </span>
    </Link>
  );
}
