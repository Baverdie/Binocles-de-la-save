"use client";

import { useEffect } from "react";

// Enregistre /sw.js au premier chargement de l'admin
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("[SW] Erreur enregistrement:", err);
      });
    }
  }, []);

  return null;
}
