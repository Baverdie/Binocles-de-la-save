"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import type { Vitrine } from "@/types";

// Bornes du ratio affiché : évite les cadres trop étirés (panoramique ou très vertical)
const RATIO_MIN = 2 / 3;
const RATIO_MAX = 16 / 9;
// Ratio utilisé tant que celui de la photo est inconnu (anciennes vitrines)
const RATIO_DEFAUT = 4 / 3;

/**
 * Borne un ratio largeur / hauteur dans l'intervalle affichable.
 * @param ratio - ratio brut de la photo
 * @returns ratio compris entre RATIO_MIN et RATIO_MAX
 */
function clampRatio(ratio: number): number {
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, ratio));
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function VitrineCard({ vitrine, index }: { vitrine: Vitrine; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;
  // Ratio connu dès le rendu si stocké, sinon mesuré au chargement de l'image
  const [ratio, setRatio] = useState<number>(
    vitrine.imageRatio ? clampRatio(vitrine.imageRatio) : RATIO_DEFAUT
  );
  const isPortrait = ratio < 1;

  /**
   * Mesure le ratio réel de la photo pour les vitrines sans ratio stocké.
   * @param event - événement de chargement de l'image
   */
  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    if (vitrine.imageRatio) return;
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setRatio(clampRatio(naturalWidth / naturalHeight));
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-16 items-center`}
    >
      <div
        className={`w-full md:w-1/2 relative rounded-2xl overflow-hidden bg-brown/5 ${isPortrait ? "max-w-sm mx-auto md:max-w-none" : ""}`}
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={vitrine.image}
          alt={vitrine.titre}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          onLoad={handleImageLoad}
        />
      </div>

      <div className="w-full md:w-1/2">
        <span className="text-xs tracking-[0.25em] uppercase text-brown/40 mb-3 block">
          {formatDate(vitrine.date)}
        </span>
        <h2 className="font-serif text-2xl md:text-3xl text-brown mb-4 leading-snug">
          {vitrine.titre}
        </h2>
        {vitrine.description && (
          <p className="text-brown/65 text-sm md:text-base leading-relaxed">
            {vitrine.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function VitrinePage() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true });
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vitrines")
      .then((res) => (res.ok ? res.json() : []))
      .then(setVitrines)
      .catch(() => setVitrines([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative min-h-[75vh] pt-24 pb-16 md:py-32 px-4 sm:px-6 bg-beige">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="vitrines-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vitrines-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0 }}
          animate={isHeaderInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 md:mb-24"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            Saison après saison
          </span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brown mb-4">
            Nos vitrines
          </h1>
          <p className="text-brown/60 text-sm max-w-md mx-auto leading-relaxed">
            Chaque vitrine est une invitation — une composition renouvelée au fil des saisons.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
          </div>
        ) : vitrines.length === 0 ? (
          <p className="text-center text-brown/50 text-sm py-20">
            Les vitrines seront bientôt disponibles.
          </p>
        ) : (
          <div className="space-y-20 md:space-y-32">
            {vitrines.map((vitrine, index) => (
              <VitrineCard key={vitrine._id} vitrine={vitrine} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
