"use client";

import { useState, useEffect } from "react";

// Retourne true si l'app tourne en mode standalone (PWA installée)
export function useIsPWA(): boolean {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  return isPWA;
}
