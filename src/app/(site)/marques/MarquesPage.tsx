"use client";

import { motion, useInView, AnimatePresence, LayoutGroup } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Marque {
  _id: string;
  nom: string;
  logo: string;
  origine?: string;
  resume?: string;
  descriptionLongue?: string;
  tags?: string[];
  images?: string[];
  lienSite?: string;
}

export default function MarquesPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [marques, setMarques] = useState<Marque[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedMarque, setSelectedMarque] = useState<Marque | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchMarques() {
      try {
        const res = await fetch("/api/marques");
        if (res.ok) {
          const data = await res.json();
          setMarques(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des marques:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMarques();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only update cursor position when modal is not open and not closing
      if (!selectedMarque && !isModalAnimating && !isClosing) {
        setCursorPos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [selectedMarque, isModalAnimating, isClosing]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  useEffect(() => {
    if (!selectedMarque && isClosing) {
      const timeout = setTimeout(() => {
        setIsClosing(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [selectedMarque, isClosing]);

  function openModal(marque: Marque) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    setIsModalAnimating(true);
    setSelectedMarque(marque);
  }

  function closeModal() {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    setIsClosing(true);
    setSelectedMarque(null);
    setIsHoveringCard(false);
  }

  if (loading) {
    return (
      <section className="min-h-[75vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brown/20 border-t-brown rounded-full animate-spin" />
      </section>
    );
  }

  if (marques.length === 0) {
    return (
      <section className="min-h-[75vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brown mb-4">
            Nos marques
          </h1>
          <p className="text-brown/60 text-sm">
            Les marques seront bientôt disponibles.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      className="relative min-h-[75vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige"
    >
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="marques-dots"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="16" cy="16" r="1" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#marques-dots)" />
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
            Sélection
          </span>
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brown mb-3 sm:mb-4">
            Nos marques
          </h1>
          <p className="text-brown/60 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
            Une sélection de créateurs et artisans lunetiers, choisis pour leur
            savoir-faire, leur qualité et leurs valeurs.
          </p>
        </motion.div>

        <LayoutGroup>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 md:gap-8 relative z-0">
            {marques.map((marque, index) => {
              const isSelected = selectedMarque?._id === marque._id;
              return (
                <motion.div
                  key={marque._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={mounted ? { opacity: isSelected ? 0 : 1, y: 0 } : {}}
                  transition={{
                    duration: 0.4,
                    delay: 0.05 + index * 0.04,
                    ease: "easeOut",
                  }}
                  className="group"
                  style={{
                    pointerEvents: isSelected ? 'none' : 'auto'
                  }}
                >
                  <motion.div
                    layoutId={`card-${marque._id}`}
                    onClick={() => openModal(marque)}
                    onMouseEnter={() => !isModalAnimating && setIsHoveringCard(true)}
                    onMouseLeave={() => !isModalAnimating && setIsHoveringCard(false)}
                    className="relative aspect-square bg-beige rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer lg:cursor-none"
                    style={{ originX: 0.5, originY: 0.5 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ layout: { type: "spring", damping: 30, stiffness: 300 }, default: { duration: 0.2 } }}
                  >
                    <motion.div
                      layoutId={`logo-${marque._id}`}
                      className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:group-hover:opacity-0 transition-opacity duration-300"
                    >
                      <Image
                        src={marque.logo}
                        alt={marque.nom}
                        width={800}
                        height={400}
                        sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
                        className="w-full h-auto max-h-12 sm:max-h-20 object-contain"
                        style={{
                          filter: "brightness(0) saturate(100%) invert(16%) sepia(27%) saturate(642%) hue-rotate(347deg) brightness(92%) contrast(92%)"
                        }}
                      />
                    </motion.div>

                    <div className="absolute inset-0 bg-brown flex flex-col items-center justify-center p-3 sm:p-4 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                      <h2 className="font-serif text-sm sm:text-lg md:text-xl text-beige mb-0.5 sm:mb-1 text-center">
                        {marque.nom}
                      </h2>
                      {marque.origine && (
                        <span className="text-[10px] sm:text-xs text-beige/60 mb-1">
                          {marque.origine}
                        </span>
                      )}
                      {marque.resume && (
                        <p className="text-[9px] sm:text-[11px] text-beige/70 text-center leading-relaxed mb-2 sm:mb-3 px-1 line-clamp-3">
                          {marque.resume}
                        </p>
                      )}
                      {marque.tags && marque.tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
                          {marque.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] text-beige/80 border border-beige/20 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                  <p className="mt-1.5 text-xs text-brown/60 text-center lg:hidden truncate px-1">
                    {marque.nom}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence
            mode="wait"
            onExitComplete={() => {
              setIsModalAnimating(false);
            }}
          >
            {selectedMarque && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={closeModal}
                  className="fixed inset-0 bg-brown/20 backdrop-blur-sm z-40"
                  key="backdrop"
                />

                <motion.div
                  layoutId={`card-${selectedMarque._id}`}
                  className="fixed inset-0 bg-beige z-50 overflow-hidden flex flex-col"
                  transition={{
                    type: "spring",
                    damping: 30,
                    stiffness: 300,
                  }}
                  key="modal"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2 }}
                    className="sticky top-0 z-20 bg-beige/95 backdrop-blur-sm border-b border-brown/10"
                  >
                    <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-3 sm:py-4">
                      <button
                        onClick={closeModal}
                        className="flex items-center gap-2 text-brown bg-brown/10 sm:bg-transparent px-3 py-2 sm:px-3 sm:py-1.5 rounded-full hover:bg-brown/10 transition-all duration-300"
                      >
                        <svg width="20" height="20" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M19 12H5M12 19l-7-7 7-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm font-medium hover:cursor-pointer">
                          Retour
                        </span>
                      </button>
                    </div>
                  </motion.div>

                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 md:p-10 lg:p-16 pt-4 sm:pt-6 md:pt-8">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-6 md:gap-10 mb-6 sm:mb-10"
                      >
                        <motion.div
                          layoutId={`logo-${selectedMarque._id}`}
                          className="w-24 h-16 sm:w-32 sm:h-20 md:w-48 md:h-28 shrink-0"
                        >
                          <Image
                            src={selectedMarque.logo}
                            alt={selectedMarque.nom}
                            width={800}
                            height={400}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 192px"
                            className="w-full h-full object-contain object-left"
                            style={{
                              filter: "brightness(0) saturate(100%) invert(16%) sepia(27%) saturate(642%) hue-rotate(347deg) brightness(92%) contrast(92%)"
                            }}
                          />
                        </motion.div>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            {selectedMarque.origine && (
                              <>
                                <span className="text-[10px] sm:text-xs text-brown/40">
                                  {selectedMarque.origine}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-accent/50" />
                              </>
                            )}
                            {selectedMarque.tags && selectedMarque.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {selectedMarque.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] text-accent bg-accent/10 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-brown mb-3 sm:mb-4">
                            {selectedMarque.nom}
                          </h2>
                          <p className="text-brown/70 text-sm sm:text-base leading-relaxed max-w-2xl">
                            {selectedMarque.descriptionLongue || selectedMarque.resume || ""}
                          </p>
                        </div>
                      </motion.div>

                      {selectedMarque.images && selectedMarque.images.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                        >
                          <h3 className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-brown/40 mb-4 sm:mb-6">
                            Aperçu des collections
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            {selectedMarque.images.map((img, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden bg-brown/5"
                              >
                                <Image
                                  src={img}
                                  alt={`${selectedMarque.nom} collection ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-brown/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <p className="text-brown/50 text-xs sm:text-sm text-center sm:text-left">
                          Découvrez la collection {selectedMarque.nom} en boutique
                        </p>
                        <div className="flex items-center gap-3">
                          {selectedMarque.lienSite && (
                            <a
                              href={selectedMarque.lienSite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 border border-brown/20 text-brown px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:border-brown/50 hover:bg-brown/5"
                            >
                              Site officiel
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M7 17l9.2-9.2M17 17V7.8H7.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </a>
                          )}
                          <Link
                            href="/rendez-vous"
                            onClick={() => setSelectedMarque(null)}
                            className="inline-flex items-center gap-2 bg-brown text-beige px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-brown/90 hover:scale-[1.02]"
                          >
                            Prendre rendez-vous
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                              <path
                                d="M4 10h12M12 6l4 4-4 4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isHoveringCard && !selectedMarque && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed pointer-events-none z-50 hidden sm:flex items-center justify-center w-16 h-16 rounded-full bg-beige border-2 border-brown"
                style={{
                  left: cursorPos.x - 32,
                  top: cursorPos.y - 32,
                }}
              >
                <span className="text-[10px] font-semibold text-brown tracking-wide">
                  CLIQUER
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-10 sm:mt-16"
        >
          <p className="text-brown/50 text-xs sm:text-sm mb-4 sm:mb-6">
            Envie de découvrir ces collections ?
          </p>
          <Link
            href="/rendez-vous"
            className="inline-flex items-center gap-2 bg-brown text-beige px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-brown/90 hover:scale-[1.02]"
          >
            Prendre rendez-vous
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10h12M12 6l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
