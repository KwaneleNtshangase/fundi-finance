"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyServiceWorkerUpdate,
  registerServiceWorker,
} from "./registerServiceWorker";

export function ServiceWorkerRegistration() {
  const [updateReady, setUpdateReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    void registerServiceWorker({
      onUpdateAvailable: (registration) => {
        registrationRef.current = registration;
        setUpdateReady(true);
      },
    });
  }, []);

  const handleRefresh = useCallback(() => {
    const registration = registrationRef.current;
    if (registration) {
      applyServiceWorkerUpdate(registration);
    }
    setUpdateReady(false);
  }, []);

  if (!updateReady) return null;

  return (
    <button
      type="button"
      onClick={handleRefresh}
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "max(16px, env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 600,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 18px",
        borderRadius: 999,
        border: "1px solid rgba(0,122,77,0.35)",
        background: "var(--color-surface, #fff)",
        color: "var(--color-primary, #007A4D)",
        fontWeight: 700,
        fontSize: 13,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        cursor: "pointer",
        maxWidth: "calc(100vw - 32px)",
      }}
    >
      Update available — tap to refresh
    </button>
  );
}
