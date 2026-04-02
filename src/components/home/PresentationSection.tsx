"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PresentationSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-beige overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ filter: "blur(60px)", opacity: 0 }}
          animate={isInView ? {
            filter: ["blur(80px)", "blur(40px)", "blur(60px)"],
            opacity: [0.1, 0.2, 0.15],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-125 h-125 bg-brown/20 rounded-full"
        />
        <motion.div
          initial={{ filter: "blur(40px)", opacity: 0 }}
          animate={isInView ? {
            filter: ["blur(50px)", "blur(20px)", "blur(50px)"],
            opacity: [0.1, 0.18, 0.1]
          } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-10 -left-10 w-80 h-80 bg-brown/15 rounded-full"
        />
        <motion.div
          initial={{ filter: "blur(30px)", opacity: 0, y: 0 }}
          animate={isInView ? {
            filter: ["blur(40px)", "blur(25px)", "blur(40px)"],
            opacity: [0.08, 0.12, 0.08],
            y: [-20, 20, -20]
          } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 -left-40 w-72 h-72 bg-brown/12 rounded-full"
        />
        <motion.svg
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 0.04 } : {}}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="presentation-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1.5" fill="#412A1C" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#presentation-grid)" />
        </motion.svg>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: "blur(12px)" }}
            animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              <div className="relative aspect-4/5 max-h-[60vh] sm:max-h-[70vh] rounded-3xl sm:rounded-4xl overflow-hidden ring-1 ring-brown/10">
                <Image
                  src="/image.png"
                  alt="Sandra Vaissière - Opticienne"
                  fill
                  className="object-cover"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: [0, 0.3, 0] } : {}}
                  transition={{ duration: 2, delay: 0.5 }}
                  className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                animate={isInView ? {
                  opacity: 1,
                  y: [0, -8, 0],
                  filter: "blur(0px)"
                } : {}}
                transition={{
                  opacity: { duration: 0.6, delay: 0.6 },
                  filter: { duration: 0.6, delay: 0.6 },
                  y: { duration: 4, delay: 1.2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute bottom-4 right-4 sm:-bottom-6 sm:-right-6 lg:bottom-8 lg:-right-8 bg-brown text-beige p-4 sm:p-6 rounded-2xl shadow-xl max-w-48 sm:max-w-52"
              >
                <p className="text-xs sm:text-sm leading-relaxed italic">
                  "Chaque regard est unique, chaque monture doit l'être aussi."
                </p>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2 text-center lg:text-left"
          >
            <span className="inline-block text-xs tracking-[0.3em] uppercase text-brown/50 mb-4">
              Votre opticienne
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brown mb-6 leading-tight">
              Sandra Vaissière
            </h2>

            <p className="text-brown/70 text-base sm:text-lg leading-relaxed mb-3 max-w-lg mx-auto lg:mx-0">
              Opticienne diplômée et passionnée, je vous accueille dans mon espace à Levignac pour vous accompagner dans le choix de vos lunettes.
            </p>
            <p className="text-brown/50 text-sm leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Installée à Levignac, j'accueille des clients de Blagnac, Colomiers, Tournefeuille, Pibrac, Léguevin et des alentours de Toulouse.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4 mb-8">
              <div className="flex items-center gap-2 sm:gap-3 bg-brown/5 rounded-full px-3 sm:px-5 py-2 sm:py-3">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-accent rounded-full"></span>
                <span className="text-xs sm:text-sm text-brown/70">Écoute attentive</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-brown/5 rounded-full px-3 sm:px-5 py-2 sm:py-3">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-accent rounded-full"></span>
                <span className="text-xs sm:text-sm text-brown/70">Service personnalisé</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-brown/5 rounded-full px-3 sm:px-5 py-2 sm:py-3">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-accent rounded-full"></span>
                <span className="text-xs sm:text-sm text-brown/70">Conseil expert</span>
              </div>
            </div>

            <Link
              href="/a-propos"
              className="inline-flex items-center gap-2 text-brown font-medium group"
            >
              <span>En savoir plus</span>
              <svg
                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
