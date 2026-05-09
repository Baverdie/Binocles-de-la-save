"use client";

import { useState, useEffect } from "react";

// Retourne true si l'app tourne en mode standalone (PWA installée)
// Vérifie les deux méthodes : matchMedia (standard) et navigator.standalone (iOS spécifique)
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsPWA(isStandalone);
  }, []);

  return isPWA;
}
