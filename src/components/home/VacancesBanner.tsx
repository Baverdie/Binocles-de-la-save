"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VacancesBannerProps {
  dateDebut: string;
  dateFin: string;
  message?: string;
}

export default function VacancesBanner({
  dateDebut,
  dateFin,
  message,
}: VacancesBannerProps) {
  const [isPastHero, setIsPastHero] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavbarVisible(true);
    }, 4200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsPastHero(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isVisible = isNavbarVisible && isPastHero;
  const fullMessage = message || `Fermeture exceptionnelle du ${dateDebut} au ${dateFin}`;

  return (
    <>
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 lg:top-20 left-0 right-0 z-40 bg-brown text-beige overflow-hidden"
          >
            <div
              className="flex whitespace-nowrap py-2.5"
              style={{ animation: "scroll 25s linear infinite" }}
            >
              {[...Array(8)].map((_, i) => (
                <span key={i} className="flex items-center text-xs sm:text-sm px-8">
                  <span className="text-beige/40 mr-3">•</span>
                  {fullMessage}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
