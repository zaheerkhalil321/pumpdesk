import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321").origin;
const supabaseSocket = supabaseOrigin.replace(/^http/, "ws");

// What the browser may load. Scripts and styles only from this site, data only from
// this site and Supabase, maps only from Google or OpenStreetMap, and no other site
// may show PumpDesk inside a frame. Inline scripts stay allowed because Next.js needs them.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseSocket}`,
  "frame-src https://www.google.com https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  poweredByHeader: false,
  experimental: {
    // Pages visited in the last 2 minutes show at once on return, with no loader.
    // A save revalidates its pages, which clears this cache, so new data is never hidden.
    staleTimes: { dynamic: 120 },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
