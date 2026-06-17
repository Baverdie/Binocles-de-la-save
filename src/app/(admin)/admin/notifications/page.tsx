"use client";

import { useState, useEffect, useCallback } from "react";
import { useIsPWA } from "@/hooks/useIsPWA";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface NotificationPreferences {
  enabled: boolean;
  events: {
    appointment: boolean;
    lensOrder: boolean;
    contactRequest: boolean;
    appointmentCancellation: boolean;
  };
}

const EVENT_LABELS: Record<keyof NotificationPreferences["events"], string> = {
  appointment: "Nouveaux rendez-vous",
  lensOrder: "Nouvelles commandes de lentilles",
  contactRequest: "Demandes de contact",
  appointmentCancellation: "Annulations / modifications de RDV",
};

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-green-500" : "bg-brown/20"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const isPWA = useIsPWA();
  const { state: pushState, error: pushError, subscribe, unsubscribe } = usePushSubscription();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notification-preferences");
      if (res.ok) setPrefs(await res.json());
    } catch {
      console.error("Erreur chargement préférences");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  async function updatePrefs(patch: Partial<NotificationPreferences>) {
    if (!prefs) return;
    const optimistic = { ...prefs, ...patch };
    setPrefs(optimistic);
    try {
      const res = await fetch("/api/admin/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setPrefs(prefs);
      }
    } catch {
      setPrefs(prefs);
    }
  }

  async function updateEvent(key: keyof NotificationPreferences["events"], value: boolean) {
    if (!prefs) return;
    const optimistic = { ...prefs, events: { ...prefs.events, [key]: value } };
    setPrefs(optimistic);
    try {
      const res = await fetch("/api/admin/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: { [key]: value } }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setPrefs(prefs);
      }
    } catch {
      setPrefs(prefs);
    }
  }

  const pushStateLabels: Record<typeof pushState, string> = {
    loading: "Vérification...",
    subscribing: "Activation en cours...",
    unsupported: "Non supporté par ce navigateur",
    "needs-pwa": "Disponible uniquement depuis l'app installée",
    denied: "Permission refusée par le navigateur",
    subscribed: "Activé sur cet appareil",
    unsubscribed: "Non activé sur cet appareil",
    error: "Erreur lors de l'activation",
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-brown">Notifications</h1>
        <p className="text-brown/50 text-sm mt-1">
          Gérez les notifications push et vos préférences
        </p>
      </div>

      {!isPWA && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-amber-800">
            Pour recevoir les notifications push, ouvre cette page depuis l&apos;application installée sur ton iPhone. Tu peux quand même configurer tes préférences ici.
          </p>
        </div>
      )}

      <div className="bg-beige/70 border border-brown/10 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium text-brown text-sm">Cet appareil</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brown">{pushStateLabels[pushState]}</p>
            {pushState === "denied" && (
              <p className="text-xs text-brown/50 mt-1">
                Réinitialise les permissions de ce site dans les réglages de ton navigateur.
              </p>
            )}
            {pushState === "error" && pushError && (
              <p className="text-xs text-red-500 mt-1 max-w-50">{pushError}</p>
            )}
          </div>
          {(pushState === "unsubscribed" || pushState === "error") && (
            <button
              onClick={subscribe}
              className="px-4 py-2 bg-brown text-beige rounded-xl text-sm hover:bg-brown/90 active:bg-brown/80 transition-colors cursor-pointer"
            >
              Activer
            </button>
          )}
          {pushState === "subscribing" && (
            <div className="w-5 h-5 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
          )}
          {pushState === "subscribed" && (
            <button
              onClick={unsubscribe}
              className="px-4 py-2 border border-brown/20 text-brown rounded-xl text-sm hover:bg-brown/5 active:bg-brown/10 transition-colors cursor-pointer"
            >
              Désactiver
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
        </div>
      ) : prefs ? (
        <>
          <div className="bg-beige/70 border border-brown/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-brown">Recevoir les notifications push</p>
                <p className="text-xs text-brown/50 mt-1">
                  Les emails de notification sont toujours envoyés. Ces réglages contrôlent uniquement les notifications push instantanées.
                </p>
              </div>
              <Toggle
                checked={prefs.enabled}
                onChange={(v) => updatePrefs({ enabled: v })}
              />
            </div>
          </div>

          <div className="bg-beige/70 border border-brown/10 rounded-2xl p-5 space-y-4">
            <h2 className="font-medium text-brown text-sm">Par type d&apos;événement (push uniquement)</h2>
            <div className="space-y-4">
              {(Object.keys(EVENT_LABELS) as Array<keyof NotificationPreferences["events"]>).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <p className={`text-sm ${prefs.enabled ? "text-brown" : "text-brown/40"}`}>
                    {EVENT_LABELS[key]}
                  </p>
                  <Toggle
                    checked={prefs.events[key]}
                    onChange={(v) => updateEvent(key, v)}
                    disabled={!prefs.enabled}
                  />
                </div>
              ))}
            </div>
          </div>

          {saved && (
            <p className="text-xs text-green-600 text-center">Préférences enregistrées</p>
          )}
        </>
      ) : (
        <p className="text-sm text-brown/50 text-center">Impossible de charger les préférences.</p>
      )}
    </div>
  );
}
