"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface DashboardData {
  stats: {
    upcomingRdvCount: number;
    activeMarques: number;
    monthContacts: number;
    monthLensOrders: number;
  };
  recentContacts: {
    _id: string;
    nom: string;
    prenom: string;
    message?: string;
    createdAt: string;
  }[];
  upcomingRdv: {
    _id: string;
    nom: string;
    prenom: string;
    typeRdv: string;
    dateRdv: string;
    heureDebut: string;
  }[];
}

const statConfig = [
  {
    key: "upcomingRdvCount" as const,
    label: "Rendez-vous à venir",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10h18M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "activeMarques" as const,
    label: "Marques actives",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: "monthContacts" as const,
    label: "Formulaires ce mois",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6M9 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "monthLensOrders" as const,
    label: "Commandes ce mois",
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 5v2M12 17v2M5 12H3M21 12h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl text-brown">
          Bonjour, {session?.user?.name}
        </h1>
        <p className="text-brown/50 text-sm mt-1">
          Voici un aperçu de votre activité
        </p>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-beige/70 border border-brown/10 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-brown/5" />
                <div>
                  <div className="h-7 w-12 bg-brown/10 rounded-lg" />
                  <div className="h-3 w-24 bg-brown/5 rounded mt-1.5" />
                </div>
              </div>
            ))}
          </div>
          {/* Activity skeleton */}
          <div className="grid lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-beige/70 border border-brown/10 rounded-2xl p-6">
                <div className="h-5 w-40 bg-brown/10 rounded-lg mb-4" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center justify-between py-3 border-b border-brown/5 last:border-0">
                      <div>
                        <div className="h-4 w-28 bg-brown/10 rounded" />
                        <div className="h-3 w-40 bg-brown/5 rounded mt-1.5" />
                      </div>
                      <div className="h-3 w-12 bg-brown/5 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !data ? (
        <p className="text-brown/50 text-sm">Erreur lors du chargement des données.</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statConfig.map((stat) => (
              <div
                key={stat.label}
                className="bg-beige/70 border border-brown/10 rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-brown/5 flex items-center justify-center text-brown/40">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-medium text-brown">{data.stats[stat.key]}</p>
                  <p className="text-xs text-brown/50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent contacts */}
            <div className="bg-beige/70 border border-brown/10 rounded-2xl p-6">
              <h2 className="font-serif text-lg text-brown mb-4">
                Derniers formulaires
              </h2>
              {data.recentContacts.length === 0 ? (
                <p className="text-brown/50 text-sm">Aucun formulaire récent</p>
              ) : (
                <div className="space-y-3">
                  {data.recentContacts.map((contact) => (
                    <div
                      key={contact._id}
                      className="flex items-center justify-between py-3 border-b border-brown/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-brown">
                          {contact.prenom} {contact.nom}
                        </p>
                        <p className="text-xs text-brown/50 truncate max-w-[150px] sm:max-w-[200px]">
                          {contact.message?.substring(0, 50)}...
                        </p>
                      </div>
                      <span className="text-xs text-brown/40">
                        {new Date(contact.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming appointments */}
            <div className="bg-beige/70 border border-brown/10 rounded-2xl p-6">
              <h2 className="font-serif text-lg text-brown mb-4">
                Prochains rendez-vous
              </h2>
              {data.upcomingRdv.length === 0 ? (
                <p className="text-brown/50 text-sm">Aucun rendez-vous à venir</p>
              ) : (
                <div className="space-y-3">
                  {data.upcomingRdv.map((rdv) => (
                    <div
                      key={rdv._id}
                      className="flex items-center justify-between py-3 border-b border-brown/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm text-brown">
                          {rdv.prenom} {rdv.nom}
                        </p>
                        <p className="text-xs text-brown/50 capitalize">{rdv.typeRdv}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-brown">
                          {new Date(rdv.dateRdv).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                        <p className="text-xs text-brown/50">{rdv.heureDebut}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
