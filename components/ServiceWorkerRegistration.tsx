"use client";

import { useEffect } from "react";

/** Registers the offline service worker; it only exists in production builds (scripts/build-sw.mjs). */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.error("Service worker registration failed", error));
  }, []);
  return null;
}
