import type { Metadata } from "next";
import { CartProvider } from "@/components/providers/CartProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Golden Bite — Good food. Great mood.",
    template: "%s · Golden Bite",
  },
  description:
    "Your favourite burgers, golden fries and feel-good meals. Order for delivery or skip the queue with pickup.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>
        <CartProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Navbar />
          {children}
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
