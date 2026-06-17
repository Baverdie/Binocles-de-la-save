"use client";

import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export type SubscriptionState =
  | "loading"
  | "subscribing"
  | "unsupported"
  | "needs-pwa"
  | "denied"
  | "subscribed"
  | "unsubscribed"
  | "error";

interface UsePushSubscriptionReturn {
  state: SubscriptionState;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushSubscription(): UsePushSubscriptionReturn {
  const [state, setState] = useState<SubscriptionState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    if (isIOS() && !isStandalone()) {
      setState("needs-pwa");
      return;
    }

    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    const timeout = setTimeout(() => setState("unsubscribed"), 3000);

    navigator.serviceWorker.ready
      .then((registration) => {
        clearTimeout(timeout);
        return registration.pushManager.getSubscription();
      })
      .then((sub) => setState(sub ? "subscribed" : "unsubscribed"))
      .catch(() => {
        clearTimeout(timeout);
        setState("unsubscribed");
      });
  }, []);

  const subscribe = useCallback(async () => {
    setState("subscribing");
    setError(null);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Clé VAPID manquante — vérifier NEXT_PUBLIC_VAPID_PUBLIC_KEY");

      let registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
      }

      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: json.keys?.p256dh || "",
            auth: json.keys?.auth || "",
          },
        }),
      });

      if (!res.ok) throw new Error(`Erreur API: ${res.status}`);

      setState("subscribed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Push] Erreur subscribe:", msg);
      setError(msg);
      if (Notification.permission === "denied") {
        setState("denied");
      } else {
        setState("error");
      }
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
    } catch (err) {
      console.error("[Push] Erreur unsubscribe:", err);
    }
  }, []);

  return { state, error, subscribe, unsubscribe };
}
