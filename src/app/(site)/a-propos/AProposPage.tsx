"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const photos = ["/a-propos.webp", "/a-propos2.webp", "/a-propos3.webp", "/a-propos4.webp"];

const valeurs = [
  {
    titre: "Écoute",
    description:
      "Chaque client est unique. Je prends le temps de comprendre vos besoins, votre style de vie, votre confort visuel et vos envies pour vous proposer les montures qui vous correspondent vraiment.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M24 14v10l6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    titre: "Qualité",
    description:
      "Je sélectionne des marques créateurs pour leur savoir-faire, leurs matériaux nobles et leur durabilité. Chaque monture est choisie avec exigence.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <path
          d="M24 4l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2 6-12z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    titre: "Proximité",
    description:
      "Installée à Levignac, je suis votre opticienne de quartier. Un suivi personnalisé, des ajustements offerts et une disponibilité pour vous accompagner.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <path
          d="M24 44s16-12 16-24a16 16 0 00-32 0c0 12 16 24 16 24z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="24" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export default function AProposPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhotoIndex((i) => (i + 1) % photos.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const storyRef = useRef(null);
  const storyInView = useInView(storyRef, { once: true, margin: "-100px" });

  const valeursRef = useRef(null);
  const valeursInView = useInView(valeursRef, { once: true, margin: "-100px" });

  return (
    <>
      <section
        ref={ref}
        className="relative min-h-[50vh] pt-24 pb-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige overflow-hidden"
      >
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="apropos-dots"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="16" cy="16" r="1" fill="#412A1C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#apropos-dots)" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
              À propos
            </span>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-brown mb-4 sm:mb-6">
              Binocles de la Save
            </h1>
            <p className="text-brown/60 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              Un regard différent sur l&apos;optique, où chaque paire de
              lunettes raconte une histoire.
            </p>
          </motion.div>
        </div>
      </section>

      <section
        ref={storyRef}
        className="relative py-16 md:py-24 px-4 sm:px-6 bg-brown overflow-hidden"
      >
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="relative aspect-4/5 max-h-[50vh] sm:max-h-none rounded-2xl sm:rounded-3xl overflow-hidden mx-auto w-full max-w-sm sm:max-w-none"
            >
              {photos.map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt="L'intérieur de la boutique Binocles de la Save"
                  fill
                  className="object-cover transition-opacity duration-1000"
                  style={{ opacity: i === photoIndex ? 1 : 0 }}
                />
              ))}
              <div className="absolute inset-0 bg-linear-to-t from-brown/30 to-transparent" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 items-center">
                {photos.map((_, i) => {
                  const isActive = i === photoIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className="cursor-pointer flex items-center"
                    >
                      <motion.div
                        className="h-2 rounded-full bg-beige/20 overflow-hidden"
                        animate={{ width: isActive ? 40 : 8 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <motion.div
                          key={isActive ? `fill-active-${photoIndex}` : `fill-inactive-${i}`}
                          className="h-full w-full rounded-full bg-beige"
                          initial={{ scaleX: isActive ? 0 : 1 }}
                          animate={{ scaleX: 1 }}
                          transition={isActive ? { duration: 10, ease: "linear" } : { duration: 0 }}
                          style={{ transformOrigin: "left", opacity: isActive ? 1 : 0.5 }}
                        />
                      </motion.div>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={storyInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <span className="inline-block text-xs tracking-[0.3em] uppercase text-beige/40 mb-3">
                Mon histoire
              </span>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-beige mb-4 sm:mb-6">
                Une passion devenue métier
              </h2>
              <div className="space-y-3 sm:space-y-4 text-beige/70 text-sm sm:text-base leading-relaxed">
                <p>
                  Après plusieurs années d&apos;expérience en tant
                  qu&apos;opticienne, j&apos;ai décidé de créer un lieu qui me
                  ressemble : un espace chaleureux où prendre le temps est une
                  priorité.
                </p>
                <p>
                  Binocles de la Save est né de cette envie de proposer une
                  approche différente de l&apos;optique. Ici, pas de vente sous
                  pression ni de montures standardisées. Je sélectionne
                  personnellement chaque marque pour sa qualité, son originalité
                  et ses valeurs.
                </p>
                <p>
                  Installée au cœur de Levignac, je suis heureuse
                  d&apos;accompagner les habitants de la région dans le choix de
                  leurs lunettes, en leur offrant un service personnalisé et un
                  suivi attentif.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={storyInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-accent/30"
              >
                <p className="text-beige/40 text-xs sm:text-sm italic">
                  &ldquo;Chaque visage mérite une monture qui lui
                  correspond.&rdquo;
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        ref={valeursRef}
        className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige overflow-hidden"
      >
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={valeursInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12"
          >
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/40 mb-3">
              Philosophie
            </span>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-brown">
              Mes valeurs
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {valeurs.map((valeur, index) => (
              <motion.div
                key={valeur.titre}
                initial={{ opacity: 0, y: 30 }}
                animate={valeursInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl text-center"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 sm:mb-6 text-accent/70">
                  {valeur.icon}
                </div>
                <h3 className="font-serif text-lg sm:text-xl text-brown mb-2 sm:mb-3">
                  {valeur.titre}
                </h3>
                <p className="text-brown/60 text-xs sm:text-sm leading-relaxed">
                  {valeur.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 px-4 sm:px-6 bg-brown">
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-beige mb-3 sm:mb-4">
              Envie de me rencontrer ?
            </h2>
            <p className="text-beige/60 text-sm sm:text-base mb-6 sm:mb-8 max-w-lg mx-auto px-2 sm:px-0">
              Venez découvrir la boutique et les collections. Je serai ravie de
              vous accueillir et de vous conseiller.
            </p>
            <Link
              href="/rendez-vous"
              className="inline-flex items-center gap-2 bg-beige text-brown px-6 sm:px-8 py-3 sm:py-4 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 hover:bg-beige/90 hover:scale-[1.02]"
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
    </>
  );
}
