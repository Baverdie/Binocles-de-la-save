"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type HoraireApi = {
  jour: number;
  ouvert: boolean;
  matin?: { debut: string; fin: string };
  aprem?: { debut: string; fin: string };
};

type VacancesApi = {
  _id: string;
  dateDebut: string;
  dateFin: string;
  message?: string;
};

type FermetureApi = {
  _id: string;
  date: string;
  journeeComplete?: boolean;
  heureDebut?: string;
  heureFin?: string;
  raison?: string;
};

const JOURS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export default function HorairesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [horaires, setHoraires] = useState<HoraireApi[]>([]);
  const [vacances, setVacances] = useState<VacancesApi[]>([]);
  const [fermetures, setFermetures] = useState<FermetureApi[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    async function fetchHoraires() {
      try {
        const res = await fetch("/api/horaires");
        if (!res.ok) return;
        const data = await res.json();
        setHoraires(Array.isArray(data.horaires) ? data.horaires : []);
        setVacances(Array.isArray(data.vacancesActives) ? data.vacancesActives : []);
        setFermetures(Array.isArray(data.fermetures) ? data.fermetures : []);
      } catch (error) {
        console.error("Erreur lors du chargement des horaires:", error);
      }
    }

    fetchHoraires();
  }, []);

  const horairesAffiches = JOURS.map((jourLabel, index) => {
    const jourIndex = index; // 0 = Dimanche
    const data = horaires.find((h) => h.jour === jourIndex);

    if (!data || !data.ouvert) {
      return { jour: jourLabel, horaire: "Fermé", closed: true };
    }

    const parts: string[] = [];
    if (data.matin?.debut && data.matin?.fin) {
      parts.push(`${formatTime(data.matin.debut)} - ${formatTime(data.matin.fin)}`);
    }
    if (data.aprem?.debut && data.aprem?.fin) {
      parts.push(`${formatTime(data.aprem.debut)} - ${formatTime(data.aprem.fin)}`);
    }

    return {
      jour: jourLabel,
      horaire: parts.length > 0 ? parts.join(" / ") : "Fermé",
      closed: parts.length === 0,
    };
  });

  // Tous les événements à venir (vacances + fermetures), triés par date
  const evenementsAVenir = (() => {
    const today = new Date().toISOString().slice(0, 10);

    const vacancesAVenir = vacances
      .filter((v) => v.dateFin && v.dateFin.slice(0, 10) >= today)
      .map((v) => ({
        type: "vacances" as const,
        date: v.dateDebut.slice(0, 10),
        label: `Du ${formatDate(v.dateDebut)} au ${formatDate(v.dateFin)}`,
        detail: v.message,
      }));

    const fermeturesAVenir = fermetures
      .filter((b) => b.date && b.date.slice(0, 10) >= today)
      .map((b) => ({
        type: "fermeture" as const,
        date: b.date.slice(0, 10),
        label: b.journeeComplete !== false
          ? `${formatDate(b.date)} — Toute la journée`
          : `${formatDate(b.date)} — ${b.heureDebut} - ${b.heureFin}`,
        detail: b.raison,
      }));

    return [...vacancesAVenir, ...fermeturesAVenir]
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <section ref={ref} className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="horaires-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#horaires-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20">
          {/* Horaires */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
              Ouverture
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-brown mb-6 sm:mb-8">
              Horaires
            </h2>

            {evenementsAVenir.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="mb-5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-brown/40 mb-2">
                  Fermetures à venir
                </p>
                <div className="space-y-1.5">
                  {evenementsAVenir.map((evt, i) => (
                    <div key={i}>
                      <p className="text-xs sm:text-sm text-brown/80 font-medium">
                        {evt.type === "vacances" ? "Fermeture prolongée" : "Fermeture exceptionnelle"} — {evt.label}
                      </p>
                      {evt.detail && (
                        <p className="text-xs text-brown/50">{evt.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="space-y-0">
              {horairesAffiches.map((item, index) => (
                <motion.div
                  key={item.jour}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.07 }}
                  className={`group flex justify-between items-center py-2.5 sm:py-3 border-b border-brown/10 transition-colors duration-300 hover:border-brown/20 ${item.closed ? "opacity-40" : ""
                    }`}
                >
                  <span className="text-brown/70 text-xs sm:text-sm transition-colors duration-300 group-hover:text-brown">
                    {item.jour}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${item.closed ? "text-brown/40" : "text-brown/90 group-hover:text-brown"
                    }`}>
                    {item.horaire}
                  </span>
                </motion.div>
              ))}
            </div>

          </motion.div>

          {/* Localisation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
              Localisation
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-brown mb-6 sm:mb-8">
              Me trouver
            </h2>

            {/* Google Maps — lazy load au clic pour éviter les cookies tiers */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100, damping: 16 }}
              className="relative aspect-4/3 mb-6 overflow-hidden rounded-2xl border border-brown/10"
            >
              {mapLoaded ? (
                <iframe
                  src="https://www.google.com/maps?q=Binocles+de+la+Save+Levignac&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: "sepia(30%) saturate(70%) hue-rotate(-10deg)" }}
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localisation Binocles de la Save"
                  className="absolute inset-0"
                />
              ) : (
                <button
                  onClick={() => setMapLoaded(true)}
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-brown/5 hover:bg-brown/10 transition-colors cursor-pointer"
                  aria-label="Charger la carte Google Maps"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-brown/40">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <span className="text-xs text-brown/50">Afficher la carte</span>
                </button>
              )}
            </motion.div>

            {/* Adresse */}
            <address className="not-italic text-brown/60 text-sm mb-6">
              <p>42 Avenue de la République</p>
              <p>31530 Levignac</p>
            </address>

            {/* CTA */}
            <Link
              href="/rendez-vous"
              className="inline-flex items-center gap-2 text-brown group"
            >
              <span className="text-sm font-medium transition-transform duration-300 group-hover:translate-x-1">
                Prendre rendez-vous
              </span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="transition-transform duration-300"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 10h12M12 6l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function formatTime(value: string) {
  return value.replace(":", "h");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(
    date
  );
}
