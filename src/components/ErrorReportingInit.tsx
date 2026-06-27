"use client";

import { useEffect } from "react";
import { installGlobalErrorReporting } from "@/lib/errorReporting";

/** Mounts once at the app root to capture uncaught client errors. */
export function ErrorReportingInit() {
  useEffect(() => {
    installGlobalErrorReporting();
  }, []);
  return null;
}
