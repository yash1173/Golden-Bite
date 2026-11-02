"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { isDemo } from "@/lib/supabase/client";
export function Footer() {
  if (
    usePathname() === "/board" ||
    process.env.NEXT_PUBLIC_BOARD_ONLY === "true"
  )
    return null;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo light />
            <p>
              A little more golden.
              <br />A whole lot of good.
            </p>
          </div>
          <div className="footer-links">
            <Link href="/#menu">
              Explore the menu <ArrowUpRight size={15} />
            </Link>
            <Link href="/account">
              Your orders <ArrowUpRight size={15} />
            </Link>
            <Link href={process.env.NEXT_PUBLIC_BOARD_URL || "/board"}>
              Live pickup screen <ArrowUpRight size={15} />
            </Link>
            <Link href="/dashboard">
              Staff dashboard <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="footer-store">
            <span>COME SAY HELLO</span>
            <p>
              100 Feet Road, Indiranagar
              <br />
              Bengaluru, Karnataka
            </p>
            <small>Every day · 11 AM – 11 PM</small>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Golden Bite. Made for good times.
          </span>
          <span>
            {isDemo
              ? "Demo store · No real orders or payments"
              : "Pay on delivery or at the counter"}
          </span>
        </div>
      </div>
    </footer>
  );
}
