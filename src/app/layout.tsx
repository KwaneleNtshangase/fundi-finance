import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorReportingInit } from "@/components/ErrorReportingInit";
import { ServiceWorkerRegistration } from "@/lib/sw/ServiceWorkerRegistration";
import { STORAGE_MIGRATION_SCRIPT } from "@/lib/storageMigration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Without this, mobile browsers render at ~980px virtual width and
// CSS media queries like max-width: 1200px never match real phones.
// Pinch-zoom stays enabled (WCAG 1.4.4) - never set maximumScale/userScalable.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Notho - Master Your Money",
  description: "Interactive personal finance learning app built for South Africa.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://fundiapp.co.za"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Notho",
  },
  icons: {
    // Square mark for icon slots. The wide lockup used to sit here, which
    // meant browsers and iOS centre-cropped it down to a sliver of the "N".
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/notho-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/notho-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    // OG wants the wide lockup, not the square mark.
    images: ["/notho-logo.png"],
    title: "Notho",
    description: "Learn to manage money the South African way",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Rebrand storage migration. Must run before hydration: hooks read
            these keys on their first render, and without this every existing
            user reads empty notho-* keys and looks brand new. */}
        <script dangerouslySetInnerHTML={{ __html: STORAGE_MIGRATION_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <PostHogProvider>{children}</PostHogProvider>
          <ServiceWorkerRegistration />
          <ErrorReportingInit />
        </ErrorBoundary>
      </body>
    </html>
  );
}
