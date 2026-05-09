"use client";

import { useState, useEffect, useCallback } from "react";

// Convertit une clé VAPID base64url en Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export type SubscriptionState =
  | "loading"
  | "unsupported"
  | "needs-pwa"
  | "denied"
  | "subscribed"
  | "unsubscribed";

interface UsePushSubscriptionReturn {
  state: SubscriptionState;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const [state, setState] = useState<SubscriptionState>("loading");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    if (isIOS() && !window.matchMedia("(display-mode: standalone)").matches) {
      setState("needs-pwa");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setState(sub ? "subscribed" : "unsubscribed");
      });
    });
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key manquante");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
        }),
      });

      setState("subscribed");
    } catch (error) {
      console.error("[Push] Erreur subscribe:", error);
      if (Notification.permission === "denied") setState("denied");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setState("unsubscribed");
    } catch (error) {
      console.error("[Push] Erreur unsubscribe:", error);
    }
  }, []);

  return { state, subscribe, unsubscribe };
}
