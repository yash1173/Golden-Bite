import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BOARD_ONLY:
      process.env.ORDER_BOARD_ONLY === "true" ? "true" : "false",
  },
  async rewrites() {
    // Deploy the same source as a second Vercel project for a dedicated screen URL.
    return {
      beforeFiles:
        process.env.ORDER_BOARD_ONLY === "true"
          ? [{ source: "/", destination: "/board" }]
          : [],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default nextConfig;
