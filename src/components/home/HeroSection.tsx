"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ProchainEvenement } from "@/app/(site)/page";

interface HeroSectionProps {
  prochainEvenement?: ProchainEvenement;
}

export default function HeroSection({ prochainEvenement }: HeroSectionProps) {
  // Animation blur pour le titre (effet de mise au point optique)
  const focusAnimation = {
    initial: { filter: "blur(12px)", opacity: 0.8 },
    animate: {
      filter: [
        "blur(12px)",
        "blur(0px)",
        "blur(5px)",
        "blur(0px)",
      ],
      opacity: 1,
    },
    transition: {
      duration: 2.5,
      delay: 0.3,
      times: [0, 0.4, 0.7, 1],
      ease: "easeOut" as const,
    },
  };

  return (
    <section className="relative min-h-screen grid grid-cols-[1fr_auto_1fr] grid-rows-[1fr_auto_1fr] overflow-hidden bg-brown gap-0">
      {/* Background pattern - grille optométrique subtile */}
      <div className="absolute inset-0 opacity-[0.12]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="#E7DAC6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-brown/0 via-brown/50 to-brown" />

      {/* Empty top-left */}
      <div />
      {/* Empty top-center */}
      <div />
      {/* Empty top-right */}
      <div />

      {/* Empty middle-left */}
      <div />

      {/* Content Title - centered */}
      <div className="relative z-10 text-center px-4">
        {/* Main title with blur-to-sharp animation */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.4, duration: 0.5 }}
              className="hidden md:block text-xs md:text-sm text-beige/60 font-mono text-right whitespace-nowrap w-16"
            >D = 50,0</motion.span>
            <motion.h1
              className="font-optician text-beige leading-none text-7xl xs:text-7xl sm:text-9xl md:text-[8rem] lg:text-[11rem] will-change-transform"
              style={{
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              {...focusAnimation}
            >
              BINOCLES
            </motion.h1>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.4, duration: 0.5 }}
              className="hidden md:block text-xs md:text-sm text-beige/60 font-mono text-left whitespace-nowrap w-16"
            >V = 0,1</motion.span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 0.5 }}
              className="hidden md:block text-xs md:text-sm text-beige/60 font-mono text-right whitespace-nowrap w-16"
            >D = 20,0</motion.span>
            <motion.h1
              className="font-optician text-beige leading-none text-6xl xs:text-6xl sm:text-8xl md:text-8xl lg:text-[9rem] will-change-transform"
              style={{
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              {...focusAnimation}
            >
              DE LA
            </motion.h1>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5, duration: 0.5 }}
              className="hidden md:block text-xs md:text-sm text-beige/60 font-mono text-left whitespace-nowrap w-16"
            >V = 0,2</motion.span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 mt-1 md:mt-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.6, duration: 0.5 }}
              className="hidden md:block text-xs md:text-sm text-beige/60 font-mono text-right whitespace-nowrap w-16"
            >D = 12,5</motion.span>
            <motion.h1
              className="font-optician text-beige leading-none text-4xl xs:text-4xl sm:text-5xl md:text-5xl lg:text-[6rem] will-change-transform"
              style={{
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0)",
              }}
              {...focusAnimation}
            >
              SAVE
            </motion.h1>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.6, duration: 0.5 }}
              className="hidden md:block text-sm md:text-sm text-beige/60 font-mono text-left whitespace-nowrap w-16"
            >V = 0,4</motion.span>
          </div>

          {/* Badge prochain événement */}
          {prochainEvenement && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.2, duration: 0.5 }}
              className="mt-6 md:mt-8"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-beige/10 border border-beige/20 text-beige text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${prochainEvenement.type === "vacances" ? "bg-amber-400" : "bg-red-400"}`} />
                {prochainEvenement.label}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Empty middle-right */}
      <div />

      {/* Empty bottom-left */}
      <div />

      {/* CTA Buttons - centered and bottom */}
      <div className="relative z-10 text-center flex flex-col justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.9, duration: 0.6 }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/rendez-vous"
              className="group relative inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-sm tracking-wide font-medium rounded-full overflow-hidden bg-beige text-brown border-2 border-beige hover:bg-brown hover:text-beige transition-all duration-300"
            >
              Prendre rendez-vous
            </Link>
            <Link
              href="/contact?vue=lentilles"
              className="inline-flex items-center justify-center px-6 py-3 sm:px-8 sm:py-4 text-sm tracking-wide font-medium rounded-full border-2 border-beige text-beige hover:bg-beige hover:text-brown transition-all duration-300"
            >
              Commander des lentilles
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Empty bottom-right */}
      <div />
    </section>
  );
}
