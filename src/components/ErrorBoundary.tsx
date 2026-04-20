"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error: Error | null };

/**
 * Catches any unhandled rendering error in the React tree and shows a
 * friendly fallback instead of Next.js's default crash screen. Users can
 * retry without losing their session or local progress.
 *
 * This is intentionally a class component - React's error boundary API
 * still only works with componentDidCatch / getDerivedStateFromError.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Fire-and-forget - analytics is optional and must never throw.
    try {
      if (typeof window !== "undefined") {
        const w = window as unknown as {
          posthog?: { capture: (e: string, p: unknown) => void };
        };
        w.posthog?.capture?.("react_error_boundary", {
          message: error.message,
          stack: error.stack?.slice(0, 1500),
          componentStack: info.componentStack?.slice(0, 1500),
        });
      }
    } catch {
      /* ignore */
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--color-bg, #ffffff)",
          color: "var(--color-text-primary, #111827)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            padding: "32px 24px",
            borderRadius: 20,
            background: "var(--color-surface, #ffffff)",
            border: "1px solid var(--color-border, #e5e7eb)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          }}
        >
          <AlertCircle
            size={48}
            aria-hidden
            style={{ color: "#6B7280", marginBottom: 12, display: "block", margin: "0 auto 12px" }}
          />
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              margin: "0 0 8px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-secondary, #6b7280)",
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}
          >
            Your progress is safe. We hit an unexpected hiccup while rendering
            this screen. Try again, and if it keeps happening please use the
            Send Feedback button in your Profile.
          </p>
          <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 12,
                border: "none",
                background: "var(--color-primary, #007A4D)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 12,
                border: "1px solid var(--color-border, #e5e7eb)",
                background: "transparent",
                color: "var(--color-text-primary, #111827)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Reload the app
            </button>
          </div>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre
              style={{
                marginTop: 20,
                padding: 12,
                borderRadius: 8,
                background: "rgba(0,0,0,0.05)",
                color: "#ef4444",
                fontSize: 11,
                textAlign: "left",
                overflow: "auto",
                maxHeight: 160,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
        </div>
      </main>
    );
  }
}
