"use client";

import { useEffect } from "react";

export function PwaLifecycleProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // In development mode, actively unregister all service workers and purge caches
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then((success) => {
            if (success) {
              console.log("[PWA Dev Manager] Successfully unregistered stale ServiceWorker in development mode.");
            }
          });
        }
      });

      if ("caches" in window) {
        caches.keys().then((cacheNames) => {
          for (const cacheName of cacheNames) {
            caches.delete(cacheName).then(() => {
              console.log(`[PWA Dev Manager] Purged cache: ${cacheName}`);
            });
          }
        });
      }
      return;
    }

    // Production mode Service Worker update & lifecycle management
    let refreshing = false;

    // Handle controller change (when new SW takes control, reload to get latest assets)
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        console.log("[PWA Manager] Controller changed. Reloading page for new version...");
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Periodically check for SW updates (every 30 minutes)
    const updateInterval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update().catch((err) => {
            console.warn("[PWA Manager] Failed to check for ServiceWorker update:", err);
          });
        }
      });
    }, 30 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      clearInterval(updateInterval);
    };
  }, []);

  return null;
}
