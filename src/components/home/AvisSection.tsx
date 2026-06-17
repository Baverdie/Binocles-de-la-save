"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { GooglePlaceData, GoogleReview } from "@/lib/google-reviews";

interface AvisSectionProps {
  googleData: GooglePlaceData | null;
}

const TEXT_TRUNCATE_LENGTH = 120;

function ReviewCard({ item, onReadMore }: { item: GoogleReview; onReadMore: () => void }) {
  const isTruncated = item.texte.length > TEXT_TRUNCATE_LENGTH;
  return (
    <div
      className={`shrink-0 w-70 sm:w-80 h-50 mr-4 sm:mr-5 rounded-2xl p-6 bg-beige/10 border border-beige/10 flex flex-col ${isTruncated ? "cursor-pointer hover:bg-beige/15 hover:border-accent/30 transition-colors" : ""}`}
      onClick={isTruncated ? onReadMore : undefined}
    >
      <div className="flex items-center gap-3 mb-3">
        {item.photoUrl ? (
          <Image src={item.photoUrl} alt={item.auteur} width={32} height={32} className="rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-beige/20 flex items-center justify-center text-beige/60 text-xs font-medium">
            {item.auteur.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-beige truncate">{item.auteur}</p>
          <p className="text-[10px] text-beige/40">{item.date}</p>
        </div>
      </div>

      <div className="text-yellow-500 text-sm mb-3">
        {"★".repeat(item.note)}{"☆".repeat(5 - item.note)}
      </div>

      {item.texte && (
        <div className="flex-1 min-h-0">
          <p className="text-sm leading-relaxed text-beige/70 line-clamp-3">
            &ldquo;{item.texte}&rdquo;
          </p>
          {isTruncated && (
            <span className="text-xs text-beige/40 mt-1 inline-block">Lire la suite...</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AvisSection({ googleData }: AvisSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const [selectedReview, setSelectedReview] = useState<GoogleReview | null>(null);

  const startAnimation = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const halfWidth = el.scrollWidth / 2;

    animationRef.current = el.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(-${halfWidth}px)` },
      ],
      {
        duration: halfWidth * 20,
        iterations: Infinity,
        easing: "linear",
      }
    );
  }, []);

  useEffect(() => {
    startAnimation();
    return () => animationRef.current?.cancel();
  }, [startAnimation]);

  const handleMouseEnter = () => animationRef.current?.pause();
  const handleMouseLeave = () => animationRef.current?.play();

  if (!googleData || googleData.reviews.length === 0) return null;

  const { rating, totalReviews, reviews, reviewUrl } = googleData;
  const duplicated = [...reviews, ...reviews];

  return (
    <section
      ref={ref}
      className="relative py-16 md:py-24 lg:py-32 bg-brown overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="avis-dots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="1" fill="#E7DAC6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#avis-dots)" />
        </svg>
      </div>

      <div className="relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 px-4 sm:px-6"
        >
          <span className="inline-block text-xs tracking-[0.3em] uppercase text-beige/40 mb-3">
            Témoignages
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-beige mb-4">
            Ce qu'ils en disent
          </h2>

          <div className="flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div className="flex items-center gap-2 text-beige/60">
              <span className="text-yellow-500 text-lg">
                {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
              </span>
              <span className="text-sm">{rating.toFixed(1)}/5 — {totalReviews} avis Google</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div ref={scrollRef} className="flex">
            {duplicated.map((item, index) => (
              <ReviewCard
                key={index}
                item={item}
                onReadMore={() => setSelectedReview(item)}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center px-4 sm:px-6"
        >
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-beige text-brown rounded-xl text-sm hover:bg-beige/90 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Laisser un avis sur Google
          </a>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedReview(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-brown border border-beige/15 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedReview.photoUrl ? (
                    <Image src={selectedReview.photoUrl} alt={selectedReview.auteur} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-beige/20 flex items-center justify-center text-beige/60 text-sm font-medium">
                      {selectedReview.auteur.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-beige">{selectedReview.auteur}</p>
                    <p className="text-xs text-beige/40">{selectedReview.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-beige/40 hover:text-beige hover:bg-beige/10 transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="text-yellow-500 text-base mb-4">
                {"★".repeat(selectedReview.note)}{"☆".repeat(5 - selectedReview.note)}
              </div>
              <p className="text-sm leading-relaxed text-beige/80">
                &ldquo;{selectedReview.texte}&rdquo;
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
