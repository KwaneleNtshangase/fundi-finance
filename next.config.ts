import type { NextConfig } from "next";

// Security headers — OWASP top-10 mitigation + POPIA hardening.
// These apply to every response served by the Next.js app.
//
// CSP note: we intentionally allow `'unsafe-inline'` for scripts because the
// current codebase relies on Next.js inline bootstrapping, inline event
// handlers from some legacy widgets, and PostHog's inline init script.
// Upgrading to strict-dynamic with nonces would require a broader refactor.
// Style needs 'unsafe-inline' for the large amount of style={{...}} JSX.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Vercel live-preview + PostHog + Supabase + our CDN
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us-assets.i.posthog.com https://us.i.posthog.com https://app.posthog.com https://*.vercel.app https://*.vercel.live https://cdn.jsdelivr.net",
      // Styles: self + inline (JSX style={{}}) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // Images: self + data URIs (emojis, canvas exports) + OAuth avatars
      "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://*.fbcdn.net https://platform-lookaside.fbsbx.com",
      // XHR / fetch / websocket
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://us.i.posthog.com https://us-assets.i.posthog.com https://app.posthog.com https://fundiapp.co.za https://wealthwithkwanele.co.za",
      // Service worker scope
      "worker-src 'self' blob:",
      // Frames: deny embedding us; allow YouTube for lessons if needed
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://formspree.io https://fundiapp.co.za https://wealthwithkwanele.co.za",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  // Clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // MIME-sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer privacy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for one year (production only — harmless on localhost)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Feature access — deny powerful APIs we do not use
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // Legacy XSS filter (ignored by modern browsers but harmless)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Opener isolation
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // PostHog + OAuth callback redirects occasionally hit old paths; allow
  // Next to follow them without logging a warning in the build output.
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
